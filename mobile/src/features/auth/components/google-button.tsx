import { Button } from '@/components/ui/button';
import { GoogleIcon } from '@/components/ui/icons/google-icon';

/** "Continue with Google" — the outline Button composed with the Google mark. */
export function GoogleButton({
  onPress,
  loading = false,
  disabled = false,
}: {
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  return (
    <Button
      variant="outline"
      label="Continue with Google"
      icon={<GoogleIcon size={20} />}
      onPress={onPress}
      loading={loading}
      disabled={disabled}
    />
  );
}
