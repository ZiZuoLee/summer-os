import axe from "axe-core";
import { expect } from "vitest";

export async function expectNoA11yViolations(container: Element) {
  const result = await axe.run(container, {
    rules: {
      // jsdom has no layout or real color calculation, so contrast belongs in Playwright.
      "color-contrast": { enabled: false },
      // Components are rendered in isolation rather than inside the full document shell.
      region: { enabled: false },
    },
  });

  expect(
    result.violations.map(({ id, help, nodes }) => ({
      id,
      help,
      targets: nodes.map((node) => node.target),
    })),
  ).toEqual([]);
}
