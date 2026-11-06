import type { JSX } from 'preact';
import { Button } from '../ui/components/Button.tsx';
import type { AdminTexts } from './AdminTexts.ts';

export interface AdminLoginProps {
  readonly text: AdminTexts;
  readonly value: string;
  readonly busy: boolean;
  readonly onInput: (value: string) => void;
  readonly onSubmit: () => void;
}

export function AdminLogin(props: AdminLoginProps): JSX.Element {
  return (
    <form
      class="admin-login"
      onSubmit={(event) => {
        event.preventDefault();
        props.onSubmit();
      }}
    >
      <label>
        {props.text.key}
        <input
          type="password"
          value={props.value}
          autoComplete="off"
          onInput={(event) => {
            props.onInput(event.currentTarget.value);
          }}
        />
      </label>
      <Button
        variant="primary"
        disabled={props.busy || props.value === ''}
        onClick={props.onSubmit}
      >
        {props.text.login}
      </Button>
    </form>
  );
}
