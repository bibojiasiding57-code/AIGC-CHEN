# Contact Privacy and Layout Design

## Goal

Update the global contact information, remove all public telephone UI, and rebalance the remaining contact actions without changing the established visual language of AIGC-CHEN.

## Confirmed content

- Canonical email: `3845498804@qq.com`
- Contact description: “致力于将前沿 AIGC 技术、数字影像美学与品牌深度叙事完美融合。如果你正在寻找商业视觉与品牌营销的全新解法，欢迎随时畅聊。”
- Desktop contact-action proportion: email approximately two thirds, copy action approximately one third.

## Data and behavior

- Keep the email address in the shared portfolio data module as the single source of truth.
- Update visible email text, the `mailto:` destination, and clipboard copying through that shared value.
- Remove the phone field from the shared contact data when no remaining component consumes it.
- The copy action must copy the canonical email and retain the existing success message “邮箱已复制”. The existing failure feedback remains available when clipboard access fails.

## Top navigation

- Remove the rightmost telephone capsule completely, including its icon, number, `tel:` link, and unused icon import.
- Reconfigure the navigation grid so the central navigation and “查看作品” action occupy the available width naturally, with no reserved telephone column.
- Preserve all current navigation labels, anchor behavior, styling, and responsive behavior otherwise.

## Contact section

- Remove the telephone tile completely.
- Keep the email tile and copy-email button as the only two actions.
- Desktop and tablet: use a two-column grid with an approximately `2fr 1fr` relationship, maintaining the current gap and visual treatment.
- Mobile at 360px/390px: stack both actions into a single column and avoid overflow or cramped text.
- Replace the descriptive paragraph exactly with the confirmed copy above.
- Preserve the current section heading, color system, borders, hover treatments, and feedback presentation.

## Cleanup and accessibility

- Delete obsolete phone-specific JSX and CSS selectors where they are no longer shared.
- Retain semantic links and buttons: the email tile remains an anchor and the copy control remains a button.
- Preserve keyboard focusability and readable button feedback.

## Verification

- Confirm no public phone number, phone icon, or `tel:` link remains in rendered application source.
- Confirm the email is rendered correctly and the `mailto:` link matches it.
- Confirm clipboard success and failure paths remain functional.
- Confirm the contact grid has two balanced items on desktop and one column on mobile.
- Run the existing automated tests and production build.
