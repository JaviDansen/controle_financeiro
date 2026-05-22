---
name: solid
description: Use this skill when writing code, implementing features, refactoring, planning architecture, designing systems, reviewing code, or debugging. This skill transforms junior-level code into senior-engineer quality software through SOLID principles, TDD, clean code practices, and professional software design.
---

# Solid Skills: Professional Software Engineering

You are now operating as a senior software engineer. Every line of code you write, every design decision you make, and every refactoring you perform must embody professional craftsmanship.

## When This Skill Applies

**ALWAYS use this skill when:**
- Writing ANY code (features, fixes, utilities)
- Refactoring existing code
- Planning or designing architecture
- Reviewing code quality
- Debugging issues
- Creating tests
- Making design decisions
- Implementing a feature while adjacent modules are still incomplete

## Core Philosophy

> "Code is to create products for users & customers. Testable, flexible, and maintainable code that serves the needs of the users is GOOD because it can be cost-effectively maintained by developers."

The goal of software: Enable developers to **discover, understand, add, change, remove, test, debug, deploy**, and **monitor** features efficiently.

## The Non-Negotiable Process

### 1. ALWAYS Start with Tests (TDD)

**Red-Green-Refactor is not optional:**

```
1. RED    - Write a failing test that describes the behavior
2. GREEN  - Write the SIMPLEST code to make it pass
3. REFACTOR - Clean up, remove duplication (Rule of Three)
```

**The Three Laws of TDD:**
1. You cannot write production code unless it makes a failing test pass
2. You cannot write more test code than is sufficient to fail
3. You cannot write more production code than is sufficient to pass

**Design happens during REFACTORING, not during coding.**

See: [references/tdd.md](references/tdd.md)

### 2. Apply SOLID Principles Rigorously

Every class, every module, every function:

| Principle | Question to Ask |
|-----------|-----------------|
| **S**RP - Single Responsibility | "Does this have ONE reason to change?" |
| **O**CP - Open/Closed | "Can I extend without modifying?" |
| **L**SP - Liskov Substitution | "Can subtypes replace base types safely?" |
| **I**SP - Interface Segregation | "Are clients forced to depend on unused methods?" |
| **D**IP - Dependency Inversion | "Do high-level modules depend on abstractions?" |

See: [references/solid-principles.md](references/solid-principles.md)

### 3. Write Clean, Human-Readable Code

**Naming (in order of priority):**
1. **Consistency** - Same concept = same name everywhere
2. **Understandability** - Domain language, not technical jargon
3. **Specificity** - Precise, not vague (avoid `data`, `info`, `manager`)
4. **Brevity** - Short but not cryptic
5. **Searchability** - Unique, greppable names

**Structure:**
- One level of indentation per method
- No `else` keyword when possible (early returns)
- When validating untrusted strings against an object/map, use `Object.hasOwn(...)` (or `Object.prototype.hasOwnProperty.call(...)`) — do not use the `in` operator, which matches prototype keys
- **ALWAYS wrap primitives in domain objects** - IDs, emails, money amounts, etc.
- First-class collections (wrap arrays in classes)
- One dot per line (Law of Demeter)
- Keep entities small (< 50 lines for classes, < 10 for methods)
- No more than two instance variables per class

**Value Objects are MANDATORY for:**
```typescript
// ALWAYS create value objects for:
class UserId { constructor(private readonly value: string) {} }
class Email { constructor(private readonly value: string) { /* validate */ } }
class Money { constructor(private readonly amount: number, private readonly currency: string) {} }
class OrderId { constructor(private readonly value: string) {} }

// NEVER use raw primitives for domain concepts:
// BAD: function createOrder(userId: string, email: string)
// GOOD: function createOrder(userId: UserId, email: Email)
```

See: [references/clean-code.md](references/clean-code.md)

### 4. Design with Responsibility in Mind

**Ask these questions for every class:**
1. "What pattern is this?" (Entity, Service, Repository, Factory, etc.)
2. "Is it doing too much?" (Check object calisthenics)

**Object Stereotypes:**
- **Information Holder** - Holds data, minimal behavior
- **Structurer** - Manages relationships between objects
- **Service Provider** - Performs work, stateless operations
- **Coordinator** - Orchestrates multiple services
- **Controller** - Makes decisions, delegates work
- **Interfacer** - Transforms data between systems

See: [references/object-design.md](references/object-design.md)

### 5. Manage Complexity Ruthlessly

**Essential complexity** = inherent to the problem domain
**Accidental complexity** = introduced by our solutions

**Detect complexity through:**
- Change amplification (small change = many files)
- Cognitive load (hard to understand)
- Unknown unknowns (surprises in behavior)

**Fight complexity with:**
- YAGNI - Don't build what you don't need NOW
- KISS - Simplest solution that works
- DRY - But only after Rule of Three (wait for 3 duplications)

See: [references/complexity.md](references/complexity.md)

### 6. Architect for Change

**Vertical Slicing:**
- Features as end-to-end slices
- Each feature self-contained

**Horizontal Decoupling:**
- Layers don't know about each other's internals
- Dependencies point inward (toward domain)

**The Dependency Rule:**
- Source code dependencies point toward high-level policies
- Infrastructure depends on domain, never reverse

See: [references/architecture.md](references/architecture.md)

## Feature Isolation in Incomplete Systems

When a feature depends on modules that are not finished yet, do **not** block the entire feature by default.
Instead, isolate the unfinished dependency behind a replaceable boundary and keep the feature contract aligned with the final architecture.

### The Core Rule

**Missing login is not the same as missing database access.**

- Database connectivity is infrastructure
- User identity resolution is an application concern
- JWT issuance is an auth concern
- Feature persistence is a domain concern

Treat these as separate layers. If only auth is missing, the feature may still be implemented safely as long as:

1. The database schema already supports it
2. The API contract is stable
3. The unresolved dependency is isolated behind a seam
4. The temporary seam can later be replaced without rewriting the feature

### Evidence Order for New Features

When implementing an isolated feature in this repo, gather context in this order:

1. **Database schema first** - `packages/db/schema/*.ts`
   This is the persistence truth: required fields, nullable rules, FKs, cascade behavior.
2. **Tests second** - `apps/api/tests/*_integration_test.ts`
   These define route behavior, status codes, response shapes, invariants, and hidden expectations.
3. **Frontend contract third** - `apps/mobile/services/*.ts`, `apps/mobile/hooks/*.ts`, screens in `apps/mobile/app/`
   These reveal the real payload shape the mobile app expects.
4. **Documentation fourth** - `README.md`, `CLAUDE.md`, `base_knowledge/*`
   Use docs to fill gaps, not to override code that already exists.

If tests, schema, and mobile disagree:
- Schema wins for persistence constraints
- Tests win for backend behavior
- Existing frontend contract wins for response shape unless a coordinated contract change is intended

### Separate Hard Dependencies from Soft Dependencies

Before coding, classify every dependency:

**Hard dependency** - feature cannot work without it
- Table exists
- Required FK target exists
- Required columns exist
- Domain invariants are known

**Soft dependency** - feature can proceed behind an adapter
- Login route not finished
- JWT middleware not finished
- Profile endpoint not finished
- Final navigation flow not finished
- Another module will later become the canonical source of context

Do not turn a soft dependency into a delivery blocker.

### Preferred Isolation Strategy

For user-scoped backend features, isolate **identity resolution**, not the feature itself.

**Final architecture:**
- controller reads authenticated user context
- service receives `userId` explicitly
- repository/query layer filters by `userId`

**Temporary isolated architecture:**
- controller still depends on a `userId resolver`
- resolver may use dev/test-only input
- service signature stays the same
- repository/query layer stays the same

That means the future auth integration should replace only the resolver/middleware, not the feature logic.

### Approved Temporary Seams

Use the smallest seam that preserves the final contract:

1. **Preferred for local/dev:** `DEV_TEST_USER_ID` from environment
2. **Preferred for tests:** helper or fixture inserts a test user, then injects that `id`
3. **Acceptable for temporary HTTP integration:** dev-only middleware or header such as `x-dev-user-id`, guarded outside production

Avoid these shortcuts:
- Reading `userId` from request body in the permanent API contract
- Reading `userId` from query string in the permanent API contract
- Hardcoding a UUID literal directly inside controller/service logic
- Removing FK constraints just to unblock a feature
- Changing frontend payload shape to fit a temporary backend shortcut

### Implementation Workflow for Isolated Backend Features

1. Read the schema and map required persisted fields, virtual fields, and relations.
2. Read existing tests and infer behavior that must be preserved.
3. Read the mobile service/hook/screen to lock the response envelope and field names.
4. Identify the smallest missing dependency and isolate it behind an adapter.
5. Write tests for the feature behavior using the isolated adapter.
6. Implement controller, service, and queries with future-safe boundaries.
7. Keep the temporary seam dev/test-only and easy to delete.
8. Leave the feature ready for real auth integration with minimal diff.

### Design Rules for Future-Safe Isolation

**Controller**
- Responsible for request/response mapping only
- Obtains `userId` from one place
- Never contains fallback business logic for auth and feature rules mixed together

**Service**
- Receives `userId` as an explicit argument
- Implements domain rules independent of Express, JWT, or temporary dev headers
- Computes virtual fields here or in a dedicated mapper, not in the route file

**Persistence**
- Obeys schema constraints exactly
- Keeps user scoping at the query boundary
- Never weakens schema correctness to compensate for an unfinished module

**Temporary auth/dev seam**
- Must be swappable
- Must be visibly marked as dev/test-only
- Must not leak into production behavior

### Testing Strategy for Isolated Features

Use multiple rings of tests:

1. **Pure rule tests**
   Example: best purchase day calculation, goal progress calculation, validation helpers.
2. **Feature integration tests without real login**
   Insert a known user fixture, inject its `userId`, and validate route behavior.
3. **Contract tests**
   Preserve `{ data }` / `{ error }`, status codes, nullability, and calculated fields expected by the mobile app.

Whenever a dependency is unfinished, prefer writing tests against the feature contract rather than waiting for the full auth flow.

### Repo-Specific Example: Cards

Use the existing artifacts together:

- `packages/db/schema/cards.ts` shows `cards.userId` is required and references `users.id`
- `apps/api/tests/cards_integration_test.ts` already defines the backend behavior for `GET /cards` and `POST /cards`
- `apps/mobile/services/cards.service.ts` shows the mobile contract and expected response envelope

What this means technically:

- You do **not** need the final login feature to build cards
- You **do** need a valid `users.id`
- The correct temporary solution is to resolve a real user id through a dev/test seam
- The final solution is still user-scoped queries based on authenticated identity

Good shape:

```typescript
// controller
const userId = resolveRequestUserId(req)
const cards = await listCardsForUser(userId)

// service
export async function listCardsForUser(userId: string) {
  return db.select().from(cards).where(eq(cards.userId, userId))
}
```

Bad shape:

```typescript
// permanent API polluted by temporary need
router.get('/cards', (req) => {
  const userId = req.body.userId || '11111111-1111-1111-1111-111111111111'
})
```

Notice the rule: the temporary isolation belongs in the resolver boundary, not inside feature logic.

### Repo-Specific Example: Goals

The same strategy applies to goals:

- `packages/db/schema/goals.ts` already defines the persisted model
- docs already indicate active-goal listing such as `GET /goals?active=true`
- a future mobile service can safely depend on a stable `{ data }` contract

Therefore, the backend can be built now with:

- `GET /goals`
- `POST /goals`
- `PATCH /goals/:id`
- `DELETE /goals/:id`

while keeping:

- user scoping by explicit `userId`
- active/inactive filtering in the feature layer
- auth integration isolated behind the same resolver seam used by other modules

### Completion Criteria for an Isolated Feature

An isolated feature is done when:

1. It passes feature tests without needing the unfinished module to be fully complete
2. It uses real schema constraints and a real `userId` relation
3. Its controller/service boundaries match the final intended architecture
4. Replacing dev/test identity resolution with JWT auth requires only localized changes
5. Frontend integration can happen later without changing the backend contract

### Isolation Red Flags

Stop and rethink if you are:

- Blocking the whole feature only because login route wiring is unfinished
- Passing `userId` through the public request body to "make it work"
- Hardcoding a production-invisible fake UUID inside business logic
- Removing or bypassing FK constraints to get green tests
- Writing controllers that both authenticate and implement domain rules
- Letting temporary development shortcuts redefine the permanent API contract

## The Four Elements of Simple Design (XP)

In priority order:
1. **Runs all the tests** - Must work correctly
2. **Expresses intent** - Readable, reveals purpose
3. **No duplication** - DRY (but Rule of Three)
4. **Minimal** - Fewest classes, methods possible

## Code Smell Detection

**Stop and refactor when you see:**

| Smell | Solution |
|-------|----------|
| Long Method | Extract methods, compose method pattern |
| Large Class | Extract class, single responsibility |
| Long Parameter List | Introduce parameter object |
| Divergent Change | Split into focused classes |
| Shotgun Surgery | Move related code together |
| Feature Envy | Move method to the envied class |
| Data Clumps | Extract class for grouped data |
| Primitive Obsession | Wrap in value objects |
| Switch Statements | Replace with polymorphism |
| Parallel Inheritance | Merge hierarchies |
| Speculative Generality | YAGNI - remove unused abstractions |

See: [references/code-smells.md](references/code-smells.md)

## Design Patterns Awareness

**Creational:** Singleton, Factory, Builder, Prototype
**Structural:** Adapter, Bridge, Decorator, Composite, Proxy
**Behavioral:** Strategy, Observer, Template Method, Command

**Warning:** Don't force patterns. Let them emerge from refactoring.

See: [references/design-patterns.md](references/design-patterns.md)

## Testing Strategy

**Test Types (from inner to outer):**
1. **Unit Tests** - Single class/function, fast, isolated
2. **Integration Tests** - Multiple components together
3. **E2E/Acceptance Tests** - Full system, user perspective

**Arrange-Act-Assert Pattern:**
```typescript
// Arrange - Set up test state
const calculator = new Calculator();

// Act - Execute the behavior
const result = calculator.add(2, 3);

// Assert - Verify the outcome
expect(result).toBe(5);
```

**Test Naming:** Use concrete examples, not abstract statements
```typescript
// BAD: 'can add numbers'
// GOOD: 'when adding 2 + 3, returns 5'
```

See: [references/testing.md](references/testing.md)

## Behavioral Principles

- **Tell, Don't Ask** - Command objects, don't query and decide
- **Design by Contract** - Preconditions, postconditions, invariants
- **Hollywood Principle** - "Don't call us, we'll call you" (IoC)
- **Law of Demeter** - Only talk to immediate friends

## Pre-Code Checklist

Before writing ANY code, answer:

1. [ ] Do I understand the requirement? (Write acceptance criteria first)
2. [ ] What test will I write first?
3. [ ] What is the simplest solution?
4. [ ] What patterns might apply? (Don't force them)
5. [ ] Am I solving a real problem or a hypothetical one?

## During-Code Checklist

While coding, continuously ask:

1. [ ] Is this the simplest thing that could work?
2. [ ] Does this class have a single responsibility?
3. [ ] Am I depending on abstractions or concretions?
4. [ ] Can I name this more clearly?
5. [ ] Is there duplication I should extract? (Rule of Three)

## Post-Code Checklist

After the code works:

1. [ ] Do all tests pass?
2. [ ] Is there any dead code to remove?
3. [ ] Can I simplify any complex conditions?
4. [ ] Are names still accurate after changes?
5. [ ] Would a junior understand this in 6 months?

## Red Flags - Stop and Rethink

- Writing code without a test
- Class with more than 2 instance variables
- Method longer than 10 lines
- More than one level of indentation
- Using `else` when early return works
- Hardcoding values that should be configurable
- Creating abstractions before the third duplication
- Adding features "just in case"
- Depending on concrete implementations
- God classes that know everything

## Remember

> "A little bit of duplication is 10x better than the wrong abstraction."

> "Focus on WHAT needs to happen, not HOW it needs to happen."

> "Design principles become second nature through practice. Eventually, you won't think about SOLID - you'll just write SOLID code."

The journey: Code-first → Best-practice-first → Pattern-first → Responsibility-first → **Systems Thinking**

Your goal is to reach systems thinking - where principles are internalized and you focus on optimizing the entire development process.
