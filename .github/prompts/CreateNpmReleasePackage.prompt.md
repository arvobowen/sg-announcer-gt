# NPM Package Release Process

You are an expert at helping with npm package releases. When the user asks to help them publish an npm package update for the sg-announcer-gt project, provide them with **all steps in a single, complete list** following the correct order of operations. Do not pause between steps or ask for confirmation after each step. Present the entire release workflow upfront in one response.

## Current Package Information
- **Package Name:** sg-announcer-gt
- **Current Version:** 1.1.1
- **Main File:** index.js

## Important Context
Always assume the user is doing a **PATCH release** (incrementing the third number: 1.1.1 → 1.1.2) unless they specify otherwise. However, always include information about semantic versioning so they understand the versioning scheme:
- **Patch** (bug fixes): `1.1.1` → `1.1.2`
- **Minor** (new features): `1.1.1` → `1.2.0`
- **Major** (breaking changes): `1.1.1` → `2.0.0`

## Publishing Steps (In Order)

Provide instructions in this exact order:

### 1. **Update version in package.json and create git tag**
Run `npm version patch` to automatically:
- Increment the version number in package.json (e.g., 1.1.1 → 1.1.2)
- Create a git commit with the version change
- Create a git tag matching the version (e.g., `v1.1.2`)

The `npm version` command handles all of this in one step. Calculate the new version based on the current version (1.1.1) and the release type (default to patch unless specified otherwise).

### 2. **Push version commit to GitHub**
Push the commit created by `npm version patch` before publishing to npm:
```bash
git push origin main
```
This keeps git history in sync with npm versions.

### 3. **Verify NPM Authentication**
Check if the user is logged into npm. If not, guide them through `npm login` with their npm credentials.

### 4. **Publish to NPM Registry**
Provide the `npm publish` command to publish the package to the npm registry. Mention that the package will be available within seconds.

### 5. **Push git tag to GitHub**
After successful npm publication, push the git tag that was automatically created by `npm version patch`:
```bash
git push origin v1.1.2
```
This pushes the tag to GitHub and maintains a connection between npm releases and git commits.

### 6. **Create GitHub Release**
Once the git tag is pushed, instruct them to create a new release on GitHub:
1. Navigate to the GitHub repository for sg-announcer-gt
2. Go to the **Releases** section
3. Click **Create a new release**
4. Select the tag that matches the version (e.g., `v1.1.2`)
5. Set the release title to match the version (e.g., `v1.1.2`)
6. **IMPORTANT:** Run the **ReleaseNotesGenerator.prompt.md** prompt to generate comprehensive release notes for this version
7. Paste the generated release notes into the release description field
8. Mark as "Latest release" if applicable
9. Click **Publish release**

## Command Format

When providing commands, adjust them based on the calculated new version number. For example:
- If current version is 1.1.1 and it's a patch release: new version is 1.1.2
- Git tag should be in format: `v1.1.2`

## Additional Tips
- Remind them that npm authentication only needs to be done once per machine
- Mention that git tags help track releases and can be used for changelog generation
- Echo and summarize the changes that have been committed and pushed to the GitHub repo as context for the release
- Present the complete release workflow as an integrated sequence without requiring confirmation between steps
- **CRITICAL:** When creating the GitHub release, always use the ReleaseNotesGenerator.prompt.md to create polished, user-friendly release notes instead of raw commit messages
