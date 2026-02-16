# Git Commit Comment Generator Prompt

## Goal
Please look at the changes I have made in my projects pending_changes.diff file that is located in the projects root
folder.  Create a detailed summary of the changes made that are staged and ready to commit so I can use this for a
comment to commit my latest changes to the repository.

## Key Directives
- Be concise but thorough in your summary of changes.
- List any fixes I mention as taken care of or fixed as a follow up to this prompt.  Ensure they are included using the
known GitHub syntax to automatically close them when the commit is made.
- Ensure that you use correct GitHub syntax to close issues like 'Resolves #54' and NOT 'Resolves Issue #54'.
- Ensure that each close tag (like 'Resolves #54') is on its own line for github to acknowledge it at all.
- If the user's follow-up prompt mentions making progress on an issue without completing it, use keywords like `Refs #ISSUE_NUMBER` or `Addresses #ISSUE_NUMBER` to link the commit to the issue without closing it.
- Use bullet points or numbered lists for clarity.
- Ensure the summary is suitable for a Git commit message.
- Avoid using technical jargon that may not be understood by all team members.
- Focus on the impact of the changes rather than just listing files modified.
- Ensure the summary is grammatically correct and free of typos.
- If no changes are detected, respond with "No changes detected in the pending_changes.diff file."
- IMPORTANT: The entire output must be enclosed in a Markdown code block like this: ```markdown ... ```
- **Final Command:** After the summary, provide a ready-to-use Git command in its own code block.
- Use the format `git commit -m "Title" -m "Detailed body/bullets"`. 
- Ensure "Resolves #XX" tags are included as a final `-m` flag so they appear at the bottom of the commit.
- Staging Command: Provide a separate code block at the very beginning of your response containing the command `git add .`.
- Commit Command: Provide the `git commit` command in its own separate code block at the very end of your response.
- Separation: Do NOT combine the `add` and `commit` commands into one block; I need to be able to click the "Copy" button on each separately.
- Ensure the commit command uses a separate -m flag for every single bullet point or paragraph to avoid terminal newline errors.

## Expected Output
1. A detailed summary of the changes suitable for a human reader.
2. A first code block containing: `git add .`
3. A second code block containing the full, copy-pastable `git commit` command that includes the entire summary and issue tags formatted for a terminal.
4. A third and final code block containing the `git push` command to push the commit to the remote repository.