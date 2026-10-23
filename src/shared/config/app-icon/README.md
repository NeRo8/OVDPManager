# Application artwork

Approved concept: an ivory folder holding a bond certificate, with a gold hryvnia
coin on its front cover, against a teal background.

- `icon.png`: approved artwork, resized to 1024 × 1024 PNG; opaque, used for iOS
  and the default app icon.
- `android-icon-foreground.png`: transparent foreground, 1024 × 1024, with padding
  to keep the visible artwork inside Android's central 66/108 safe circle.
- `splash-icon.png`: transparent artwork, 1024 × 1024, displayed at a canvas width
  of 240 points on `#046865`.

The old Expo Icon Composer bundle, background and monochrome images are no longer
referenced by `app.json`. A custom Android themed monochrome icon is not configured.

Artwork was prepared using the built-in imagegen tool. The approved original was
resized without regenerating it. The selected transparent derivative used this prompt:

> Extract this approved folder/document/coin logo as an immaculate transparent PNG for a real mobile app. Preserve the original design exactly. Remove ONLY the outside background around the complete silhouette. KEEP ALL INTERIOR TEAL DETAILS OPAQUE AND UNCHANGED: the document rules, document border, seal, gap between folder panels and currency symbol. These teal parts must stay solid deep teal #046865, with no holes or speckles. Keep ivory and gold opaque. Absolutely smooth clean antialiased exterior edges, no white halo, no irregular fragments, no speckling. Flat clean solid colors. Logo remains centered in a square canvas and occupies 55 percent of its width and 60 percent of its height, generous transparent margins. The same recognizable office file folder with centered golden hryvnia coin on the front and bond document protruding from inside. No redesign or additional details. Output transparent background, 1024x1024.

These assets are configured at build time. Rebuild the application to see changes;
verify the native splash screen in a release build.
