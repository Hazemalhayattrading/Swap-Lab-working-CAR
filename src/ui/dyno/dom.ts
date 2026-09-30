/** Small DOM helpers for the dyno sheet, so its markup reads top to bottom. */

type Child = Node | string | null | undefined | false;

export interface Props {
  class?: string;
  id?: string;
  text?: string;
  attrs?: Record<string, string>;
}

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Props = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (props.class) node.className = props.class;
  if (props.id) node.id = props.id;
  if (props.text !== undefined) node.textContent = props.text;
  for (const [key, value] of Object.entries(props.attrs ?? {})) node.setAttribute(key, value);
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child);
  }
  return node;
}

export function byId(id: string): HTMLElement {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Missing #${id} in index.html`);
  return node;
}

/**
 * A row of square toggle keys (radio inputs), like the quality keys on the
 * telemetry strip. Returns the fieldset; `onChange` gets the picked value.
 */
export function keyRow<T extends string | number>(
  name: string,
  legend: string,
  options: readonly { value: T; label: string; title?: string }[],
  current: T,
  onChange: (value: T) => void,
): HTMLFieldSetElement {
  const set = h('fieldset', { class: 'keys' }, h('legend', { text: legend }));
  for (const option of options) {
    const input = h('input', {
      attrs: { type: 'radio', name, value: String(option.value) },
    });
    input.checked = option.value === current;
    input.addEventListener('change', () => {
      if (input.checked) onChange(option.value);
    });
    const label = h(
      'label',
      option.title ? { attrs: { title: option.title } } : {},
      input,
      h('span', { text: option.label }),
    );
    set.append(label);
  }
  return set;
}
