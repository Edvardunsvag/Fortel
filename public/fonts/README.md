# Volksans Font Setup

## Download Instructions

1. Visit the official Volksans font page: https://radmirvolk.design/fonts/volksans
2. Download the font files (usually comes as a ZIP file)
3. Extract the font files
4. Place the following font files in this directory (`/public/fonts/`):
   - `volksans-regular.woff2` (or `.woff` if woff2 is not available)
   - `volksans-bold.woff2` (or `.woff` if woff2 is not available)

## Converting Font Files (if needed)

If you have `.ttf` or `.otf` files, you can convert them to `.woff2` using online tools like:
- https://cloudconvert.com/ttf-to-woff2
- https://convertio.co/ttf-woff2/

## File Naming

The font-face declarations in `src/index.scss` expect these file names:
- `volksans-regular.woff2` (or `volksans-regular.woff`)
- `volksans-bold.woff2` (or `volksans-bold.woff`)

If your downloaded files have different names, either:
1. Rename them to match the expected names, OR
2. Update the file paths in `src/index.scss` @font-face declarations

## License

Please ensure you review and comply with the Volksans font license terms from the official website.

