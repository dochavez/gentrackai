import { useLocalSearchParams } from 'expo-router';

import { SubmitOfferScreen } from '@/features/technician/submit-offer-screen';

export default function SubmitOffer() {
  const { requestId } = useLocalSearchParams<{ requestId: string }>();
  return <SubmitOfferScreen requestId={requestId} />;
}
