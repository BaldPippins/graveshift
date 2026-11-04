import type { JSX } from 'preact';
import { quotePurchase } from '@graveshift/shared/rules';
import type { PurchaseContext, ShopOffer } from '@graveshift/shared/rules';
import { Button } from '../../components/Button.tsx';
import { useServices } from '../../ServicesContext.ts';
import { useMessages } from '../../useMessages.ts';

export interface OfferButtonProps {
  readonly offer: ShopOffer;
  readonly context: PurchaseContext;
  readonly label: string;
}

export function OfferButton(props: OfferButtonProps): JSX.Element {
  const { commands } = useServices();
  const messages = useMessages();
  const quote = quotePurchase(props.offer, props.context);
  const reason = quote.rejection === null ? null : messages.purchaseRejections[quote.rejection];
  return (
    <span class="offer">
      <Button
        variant={reason === null ? 'primary' : 'ghost'}
        disabled={reason !== null}
        title={reason ?? ''}
        onClick={() => {
          commands.purchase(props.offer);
        }}
      >
        {props.label} · 💰{quote.price}
      </Button>
      {reason === null ? null : <small class="offer__reason">{reason}</small>}
    </span>
  );
}
