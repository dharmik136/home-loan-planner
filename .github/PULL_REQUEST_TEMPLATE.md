## Describe your changes
Please include a summary of the changes, the related issue/feature number, and the motivations behind them.

## Type of change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Mathematical correction / Math audit updates
- [ ] Documentation update (e.g. README/specs)

## How Has This Been Tested?
Please describe the tests that you ran to verify your changes. Provide instructions so we can reproduce.
- [ ] **Vitest Unit Tests**: `npm test` passed inside `/web`
- [ ] **Playwright Browser Tests**: `npx playwright test` passed inside `/web`
- [ ] **Workbook verification script**: `python src/verify_workbook.py` passed

## Checklist:
- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] My changes generate no new lint warnings or compilation errors
- [ ] I have added math verification tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] I have updated the `improvements_log.csv` file with my entry details
