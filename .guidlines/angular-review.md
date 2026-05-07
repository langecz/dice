# Angular Code Review Checklist

This checklist is designed to ensure that Angular projects adhere to best practices for TypeScript, Angular development, accessibility, testing, and Angular Material usage. It is based on established guidelines for scalable, maintainable, and performant web applications. Reviewers should check each item and note any deviations or improvements needed.

## 1. TypeScript Best Practices
- [ ] Strict type checking is enabled and enforced throughout the codebase.
- [ ] Type inference is preferred where the type is clear; explicit types are used only when necessary.
- [ ] The `any` type is avoided; `unknown` is used when the type is uncertain.
- [ ] Interfaces and types are defined appropriately for data models and function signatures.

## 2. Angular Best Practices
- [ ] The project uses Angular version 21 or higher.
- [ ] All components are standalone (no NgModules); `standalone: true` is not explicitly set in decorators (default in v20+).
- [ ] Signals are used for state management in components.
- [ ] Feature routes implement lazy loading.
- [ ] `@HostBinding` and `@HostListener` decorators are not used; host bindings are placed in the `host` object of `@Component` or `@Directive` decorators.
- [ ] `NgOptimizedImage` is used for all static images (not applicable for inline base64 images).

## 3. Accessibility Requirements
- [ ] The code passes all AXE checks.
- [ ] It follows WCAG AA minimums, including proper focus management, color contrast, and ARIA attributes.
- [ ] Interactive elements have appropriate ARIA labels and roles.
- [ ] Keyboard navigation is fully supported.

## 4. Components
- [ ] Components are small and focused on a single responsibility.
- [ ] `input()` and `output()` functions are used instead of `@Input` and `@Output` decorators.
- [ ] `computed()` is used for derived state.
- [ ] `changeDetection: ChangeDetectionStrategy.OnPush` is set in the `@Component` decorator.
- [ ] Inline templates are preferred for small components; larger templates use separate files with paths relative to the component TS file.
- [ ] Signal Forms are used for new, signal-based applications (from `@angular/forms` and `@angular/forms/signals`); no third-party libraries.
- [ ] `ngClass` is not used; `class` bindings are used instead.
- [ ] `ngStyle` is not used; `style` bindings are used instead.

## 5. State Management
- [ ] Signals are used for local component state.
- [ ] `computed()` is used for derived state.
- [ ] State transformations are pure and predictable.
- [ ] `mutate` is not used on signals; `update` or `set` is used instead.

## 6. Templates
- [ ] Templates are kept simple and avoid complex logic.
- [ ] Templates are always in separate files (not inline).
- [ ] Native control flow (`@if`, `@for`, `@switch`) is used instead of `*ngIf`, `*ngFor`, `*ngSwitch`.
- [ ] The async pipe is used to handle observables.
- [ ] Globals like `new Date()` are not assumed available; dependencies are injected.
- [ ] Arrow functions are not written in templates (not supported).

## 7. Services
- [ ] Services are designed around a single responsibility.
- [ ] Singleton services use `providedIn: 'root'`.
- [ ] The `inject()` function is used instead of constructor injection.

## 8. Angular Material Requirements
- [ ] Angular Material is the required UI component library; no custom HTML/CSS implementations unless approved.
- [ ] The "Azure & Blue" theme is used as the default.
- [ ] Material Design version 3 is used for styling and layout.
- [ ] Buttons are generated as `<button matButton="filled"></button>`.

## 9. Testing
- [ ] Tests are added for any new logic.
- [ ] Tests are run using `ng test --watch=false`.
- [ ] Each test has comments with proper descriptions.

## 10. General Rules
- [ ] Code is functional, maintainable, performant, and accessible.
- [ ] No violations of copyrights or harmful content.
- [ ] Follows Microsoft content policies.

## Review Process
- **Pre-Review**: Ensure the code compiles without errors (check with `ng build` or similar).
- **Automated Checks**: Run linters, accessibility tools (e.g., AXE), and tests.
- **Manual Review**: Go through this checklist item by item.
- **Feedback**: Provide specific comments on failures, suggestions for improvements, and approval for passing items.
- **Approval**: Code can be merged only if all critical items pass and non-critical items have acceptable justifications.

This checklist should be customized based on project-specific needs. For any items not covered, refer to the official Angular documentation and best practices.
