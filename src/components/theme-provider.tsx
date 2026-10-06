"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

type Props = ComponentProps<typeof NextThemesProvider>;

/* Dark-only since the Guardian redesign (Task 26): the light theme no
 * longer exists. forcedTheme keeps next-themes from ever flipping the
 * `dark` class on <html>, so the palette can't regress to light. */
export function ThemeProvider({ children, ...props }: Props) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      forcedTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
