import type { TargetedKeyboardEvent } from 'preact';

export function selectOptionOnKeyDown<T extends string | number>(
  event: TargetedKeyboardEvent<HTMLButtonElement>,
  options: readonly T[],
  value: T,
  onChange: (value: T) => void,
): void {
  const current = options.indexOf(value);
  let next: number;
  switch (event.key) {
    case 'ArrowRight':
    case 'ArrowDown':
      next = (current + 1) % options.length;
      break;
    case 'ArrowLeft':
    case 'ArrowUp':
      next = (current + options.length - 1) % options.length;
      break;
    case 'Home':
      next = 0;
      break;
    case 'End':
      next = options.length - 1;
      break;
    default:
      return;
  }
  const option = options[next];
  if (option === undefined) return;
  event.preventDefault();
  const parent = event.currentTarget.parentElement;
  if (parent !== null) {
    const button = parent.querySelectorAll<HTMLButtonElement>('button')[next];
    if (button !== undefined) button.focus();
  }
  onChange(option);
}
