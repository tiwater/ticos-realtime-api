# Publishing Guide

## Automated Publishing

This project uses GitHub Actions to automatically publish to npm.

### Dev Branch Publishing

**Workflow**: [.github/workflows/publish-dev.yml](.github/workflows/publish-dev.yml)

**Trigger**: Automatic on every push to the `dev` branch

**Process**:
1. Runs type checking, linting, and tests
2. Builds the package
3. Publishes to npm with the `dev` distribution tag
4. Published as `@ticos/realtime-api@dev`

**Installation**:
```bash
npm install @ticos/realtime-api@dev
```

### Version Management

Dev versions follow the pattern: `X.Y.Z-dev.N`
- Example: `0.3.5-dev.2`
- Update the version in `package.json` before pushing to `dev`

### Required Setup

#### 1. NPM Token

You need to add an NPM access token to your GitHub repository secrets:

1. **Create NPM Token**:
   - Go to https://www.npmjs.com/settings/[your-username]/tokens
   - Click "Generate New Token" → "Classic Token"
   - Select "Automation" type
   - Copy the token (it won't be shown again)

2. **Add to GitHub Secrets**:
   - Go to your repository on GitHub
   - Navigate to Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `NPM_TOKEN`
   - Value: Paste your npm token
   - Click "Add secret"

#### 2. Repository Permissions

Ensure the GitHub Actions workflow has permission to publish:
- Go to Settings → Actions → General
- Under "Workflow permissions", ensure "Read and write permissions" is selected

### Manual Publishing

If you need to publish manually:

```bash
# For dev versions
pnpm publish --tag dev --no-git-checks

# For stable versions (from main branch)
pnpm publish
```

### Publishing Flow

```
dev branch push
    ↓
GitHub Actions triggered
    ↓
Run tests & build
    ↓
Publish to npm with --tag dev
    ↓
Available as @ticos/realtime-api@dev
```

### Troubleshooting

**Q: Workflow fails with "npm ERR! need auth"**
- A: Check that `NPM_TOKEN` secret is set correctly in repository settings

**Q: Version already exists error**
- A: Update the version number in `package.json` before pushing

**Q: Want to publish stable version**
- A: Merge to `main` branch and create a workflow for stable releases, or publish manually

### Distribution Tags

- `dev`: Development versions from dev branch
- `latest`: Stable versions (default, set manually or from main branch)

### Best Practices

1. **Before pushing to dev**:
   - Update version in `package.json` (increment the dev number)
   - Ensure all tests pass locally
   - Review your changes

2. **Version numbering**:
   - Increment patch: `0.3.5-dev.2` → `0.3.5-dev.3`
   - New feature: `0.3.5-dev.2` → `0.4.0-dev.1`
   - Breaking change: `0.3.5-dev.2` → `1.0.0-dev.1`

3. **Testing published package**:
   ```bash
   npm install @ticos/realtime-api@dev
   ```
