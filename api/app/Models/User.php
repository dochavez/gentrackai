<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Notifications\ResetPasswordNotification;
use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Str;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'google_id',
        'apple_id',
        'avatar',
        'provider',
        'address_line1',
        'address_line2',
        'city',
        'state',
        'postal_code',
        'country',
        'phone',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'apple_refresh_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            // Only ever used server-side, to revoke the Apple grant on deletion.
            'apple_refresh_token' => 'encrypted',
        ];
    }

    /**
     * Send the password reset notification.
     *
     * Overridden so the reset link points at the mobile/web frontend rather
     * than a backend route (the app owns the reset UI).
     */
    public function sendPasswordResetNotification($token): void
    {
        $this->notify(new ResetPasswordNotification($token));
    }

    /**
     * All organizations the user is a member of, with their per-org role.
     *
     * @return BelongsToMany<Organization, $this>
     */
    public function organizations(): BelongsToMany
    {
        return $this->belongsToMany(Organization::class)
            ->withPivot('role')
            ->withTimestamps();
    }

    /**
     * The user's active organization (what the app is currently scoped to).
     *
     * @return BelongsTo<Organization, $this>
     */
    public function currentOrganization(): BelongsTo
    {
        return $this->belongsTo(Organization::class, 'current_organization_id');
    }

    /**
     * Alias for the active organization. Kept so the many controller guards and
     * fleet queries that read `$user->organization` as "the active org" keep
     * working after the move to multi-org membership.
     *
     * @return BelongsTo<Organization, $this>
     */
    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class, 'current_organization_id');
    }

    /**
     * Back-compat accessor: the active org's id. Replaces the old flat
     * `organization_id` column with the `current_organization_id` pointer.
     */
    protected function organizationId(): Attribute
    {
        return Attribute::get(fn (): ?int => $this->current_organization_id);
    }

    /**
     * The user's role in a given organization (defaults to the active one),
     * read from the membership pivot. Null when they are not a member.
     */
    public function roleIn(Organization|int|null $organization = null): ?string
    {
        $organizationId = $organization instanceof Organization
            ? $organization->id
            : ($organization ?? $this->current_organization_id);

        if ($organizationId === null) {
            return null;
        }

        if ($this->relationLoaded('organizations')) {
            return $this->organizations->firstWhere('id', $organizationId)?->pivot->role;
        }

        return $this->organizations()
            ->where('organizations.id', $organizationId)
            ->value('organization_user.role');
    }

    /**
     * Back-compat accessor: the user's role in their active org. Replaces the
     * old flat `role` column.
     */
    protected function role(): Attribute
    {
        return Attribute::get(fn (): ?string => $this->roleIn());
    }

    public function isOwner(): bool
    {
        return $this->roleIn() === 'owner';
    }

    public function isOwnerOf(Organization|int $organization): bool
    {
        return $this->roleIn($organization) === 'owner';
    }

    /** Owner or admin of the active org — can see all work and manage the team. */
    public function canManageTeam(): bool
    {
        return in_array($this->roleIn(), ['owner', 'admin'], true);
    }

    /** Owner or admin of a specific organization. */
    public function canManageTeamIn(Organization|int $organization): bool
    {
        return in_array($this->roleIn($organization), ['owner', 'admin'], true);
    }

    /** Whether the user is a member of the given organization. */
    public function belongsToOrganization(Organization|int $organization): bool
    {
        return $this->roleIn($organization) !== null;
    }

    /**
     * Whether the user's active org is a technician provider — i.e. the
     * technician panel is usable in the current scope. A company member acting
     * as a technician switches into the company (provider) org first.
     */
    public function isTechnician(): bool
    {
        return (bool) $this->currentOrganization?->isProvider();
    }

    /**
     * Whether the user has a service address complete enough to file a request
     * (the `state` in particular drives area matching). A presentation boolean,
     * computed here so the app never derives it.
     */
    public function hasAddress(): bool
    {
        return filled($this->address_line1)
            && filled($this->city)
            && filled($this->state)
            && filled($this->postal_code);
    }

    /**
     * A single-line service address, or null when incomplete. Presentation value.
     */
    protected function fullAddress(): Attribute
    {
        return Attribute::get(function (): ?string {
            if (! $this->hasAddress()) {
                return null;
            }

            $line = trim((string) $this->address_line1.' '.(string) $this->address_line2);

            return Str::of($line.', '.$this->city.', '.$this->state.' '.$this->postal_code)->squish();
        });
    }

    /**
     * @return HasMany<Generator, $this>
     */
    public function generators(): HasMany
    {
        return $this->hasMany(Generator::class);
    }

    /**
     * @return HasMany<Task, $this>
     */
    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    /**
     * @return HasOne<ChatConversation, $this>
     */
    public function chatConversation(): HasOne
    {
        return $this->hasOne(ChatConversation::class);
    }

    /**
     * First name — a presentation value, computed here so resources never derive it.
     */
    protected function firstName(): Attribute
    {
        return Attribute::get(function (): ?string {
            $first = Str::of((string) $this->name)->squish()->explode(' ')->first();

            return $first === '' ? null : $first;
        });
    }

    /**
     * Up-to-two-letter initials from the name (falling back to the email).
     */
    protected function initials(): Attribute
    {
        return Attribute::get(function (): string {
            $words = Str::of((string) $this->name)->squish()->explode(' ')->filter();

            if ($words->count() >= 2) {
                return Str::upper(Str::substr($words->first(), 0, 1).Str::substr($words->get(1), 0, 1));
            }

            if ($words->count() === 1) {
                return Str::upper(Str::substr($words->first(), 0, 2));
            }

            return Str::upper(Str::substr((string) $this->email, 0, 1)) ?: 'U';
        });
    }
}
