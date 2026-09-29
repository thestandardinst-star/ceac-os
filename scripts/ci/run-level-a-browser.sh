#!/usr/bin/env bash
set -euo pipefail

scope="${1:-full}"

case "$scope" in
  stage14)
    tests=(tests/experience-v2-stage14-*.spec.js tests/role-routing.spec.js)
    ;;
  finance)
    tests=(tests/experience-v2-finance-*.spec.js tests/role-routing.spec.js)
    ;;
  workforce)
    tests=(tests/experience-v2-workforce-*.spec.js tests/role-routing.spec.js)
    ;;
  project)
    tests=(tests/experience-v2-project-family.spec.js tests/role-routing.spec.js)
    ;;
  people)
    tests=(tests/experience-v2-people-family.spec.js tests/role-routing.spec.js)
    ;;
  work)
    tests=(tests/experience-v2-work-family.spec.js tests/role-routing.spec.js)
    ;;
  reports)
    tests=(tests/premium-redesign-r7.spec.js tests/role-routing.spec.js)
    ;;
  personal)
    tests=(tests/experience-v2-personal-*.spec.js tests/role-routing.spec.js)
    ;;
  shell)
    tests=(
      tests/experience-v2-components.spec.js
      tests/experience-v2-interactions.spec.js
      tests/experience-v2-shell*.spec.js
      tests/role-routing.spec.js
    )
    ;;
  *)
    tests=(tests/*.spec.js)
    ;;
esac

echo "Level A browser scope: $scope"
npx playwright test "${tests[@]}"
