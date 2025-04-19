# Documentation Scripts

This directory contains scripts for generating and publishing API documentation.

## Configuration Files

- `typedoc.json` - Configuration for TypeDoc that specifies what files to document, output format (MDX), and other documentation settings.

## Scripts

- `publish-docs.mts` - Copies generated documentation to a Nextra project and generates \_meta.ts files for navigation.

## Usage

### Generate API Documentation

To generate API documentation as MDX files in the `docs/` directory:

```bash
pnpm docs:generate
```

### Publish to Nextra Project

To publish the generated documentation to a Nextra project:

```bash
# Default: Publishes to each locale's realtime-typescript-sdk directory
# Creates copies for English (en) and Chinese (zh) locales
pnpm docs:publish

# To specify a custom target directory:
pnpm docs:publish -- --target /path/to/target/directory

# To specify different locales (comma-separated list):
pnpm docs:publish -- --locales "en,zh-CN"
```

### All-in-One Command

To generate and publish documentation in one step:

```bash
pnpm docs
```

## Documentation Organization for Multilingual Sites

The documentation is organized to work seamlessly with Nextra sites that support multiple languages:

1. **Direct Copies for Each Locale**: The script creates separate copies of the documentation for each configured locale:

   - `/content/en/realtime-typescript-sdk/` - English documentation
   - `/content/zh/realtime-typescript-sdk/` - Chinese documentation

2. **Unified Navigation**: The title "Realtime SDK" appears as a single entry in the navigation menu for each locale.

This approach provides:

- A clean, intuitive navigation structure
- Documentation that integrates with the multilingual site structure
- Copies in each locale directory for consistent URL patterns

## How It Works

1. The TypeDoc configuration in `typedoc.json` is set up to generate MDX files directly
2. The `publish-docs.mts` script:
   - Creates copies of the MDX files in each locale's directory (`/content/{locale}/realtime-typescript-sdk/`)
   - Generates \_meta.ts files only within the SDK directories, not in the locale directories
   - Formats titles for better readability in navigation

## Customization

To modify the documentation process:

1. Edit `typedoc.json` to change what gets documented and how
2. Edit `publish-docs.mts` to change how the docs are published to Nextra
