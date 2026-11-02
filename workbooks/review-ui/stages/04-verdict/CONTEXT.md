# Stage 04: verdict

## Input
The findings table from stages 02 and 03.

## Process
1. Order: BLOCKER, MAJOR, MINOR; inside a severity by file.
2. Verdict: APPROVE when there is no BLOCKER and no MAJOR; else REJECT with the counts.
3. Three lines at most of summary, no praise, no restatement of findings.
4. On a GitHub or GitLab PR: post the table and the verdict as one comment; inline comments on
   the affected lines when the review was asked as a PR review. Posting needs the human's yes
   unless the task said so.

## Output
The review message.

## Completion
Deliver it. Then proceed to `05-learn`.
