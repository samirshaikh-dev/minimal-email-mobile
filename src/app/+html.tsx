import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <ScrollViewStyleReset />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              /* Position tabs in footer like mobile on web */
              div[role="tablist"][aria-label="Main"],
              [class*="navigationMenuRoot"] {
                top: auto !important;
                bottom: 0 !important;
                left: 50% !important;
                transform: translateX(-50%) !important;
                position: fixed !important;
                z-index: 1000 !important;
                display: flex !important;
                width: 100% !important;
                max-width: 640px !important;
                height: 60px !important;
                border-radius: 0 !important;
                border-top: 1px solid #E2E8F0 !important;
                border-left: 1px solid #E2E8F0 !important;
                border-right: 1px solid #E2E8F0 !important;
                background-color: #FFFFFF !important;
                align-items: center !important;
                justify-content: space-around !important;
                padding: 6px 12px !important;
                box-sizing: border-box !important;
                box-shadow: 0 -2px 10px 0 rgba(15, 23, 42, 0.05) !important;
              }

              div[role="tablist"][aria-label="Main"] button[role="tab"],
              [class*="navigationMenuTrigger"] {
                flex: 1 !important;
                height: 44px !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                border-radius: 10px !important;
                padding: 0 10px !important;
                margin: 0 !important;
                background-color: transparent !important;
              }

              div[role="tablist"][aria-label="Main"] button[role="tab"][data-state="active"],
              [class*="navigationMenuTrigger"][data-state="active"] {
                background-color: #EEF2FF !important;
              }

              div[role="tablist"][aria-label="Main"] [class*="tabText"],
              [class*="navigationMenuTrigger"] [class*="tabText"] {
                color: #475569 !important;
                font-size: 13px !important;
                font-weight: 500 !important;
              }

              div[role="tablist"][aria-label="Main"] button[role="tab"][data-state="active"] [class*="tabText"],
              [class*="navigationMenuTrigger"][data-state="active"] [class*="tabText"] {
                color: #4F46E5 !important;
                font-weight: 600 !important;
              }

              [class*="tabContent"],
              div[data-radix-tabs-content] {
                padding-bottom: 72px !important;
                flex: 1 !important;
              }
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
