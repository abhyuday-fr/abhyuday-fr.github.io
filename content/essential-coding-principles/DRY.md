+++
date = '2026-08-19T09:25:09+05:30'
draft = false
comments = true
title = 'DRY'
description = "Don't Repeat Yourself is the second principle mentioned in the book."
tags = ['cpp', 'coding', 'programming', 'principles']
categories = ['Pragmatic Programmer Principles']
+++

"Every piece of knowledge must have a single, unambiguous,
authoritative representation within a system." referenced by [The Pragmatic Programmer](https://pragprog.com/titles/tpp20/the-pragmatic-programmer-20th-anniversary-edition/).

DRY is more than code. Here’s the acid test: when some single facet of the code has to
change, do you find yourself making that change in multiple
places, and in multiple different formats? Do you have to
change code and documentation, or a database schema and a
structure that holds it, or…? If so, your code isn’t DRY.

The book breaks violations of DRY into a few flavors: duplication in the
code itself, duplication between code and documentation, duplication of
representation across boundaries (internal APIs, external APIs, and
datasources), and duplication that happens between developers who don't
know a piece of knowledge already exists. Below are examples of each,
non-DRY first and then the DRY fix.

## Code duplication

The most familiar kind: the same logic, copy-pasted (or re-typed) in more
than one place.

### The "Not DRY" approach

```cpp
#include <iostream>
#include <string>

struct Order { double price; int quantity; bool isMember; };

// Discount logic duplicated wherever a total needs to be computed.
double computeCheckoutTotal(const Order& order) {
    double total = order.price * order.quantity;
    if (order.isMember) {
        total *= 0.9; // 10% member discount
    }
    return total;
}

double computeInvoiceTotal(const Order& order) {
    double total = order.price * order.quantity;
    if (order.isMember) {
        total *= 0.9; // Same 10% member discount, copy-pasted
    }
    return total;
}
```

This is not DRY because:
* **Two sources of truth**: The discount rate `0.9` lives in two places. Change it in one and the other silently drifts.
* **Copy-paste drift**: Nothing stops a future edit (say, adding tax) from being applied to only one of the functions.

### The DRY approach

```cpp
#include <iostream>
#include <string>

struct Order { double price; int quantity; bool isMember; };

// Single, authoritative representation of "how a total is computed".
double computeTotal(const Order& order) {
    double total = order.price * order.quantity;
    if (order.isMember) {
        total *= 0.9; // 10% member discount, defined once
    }
    return total;
}

double computeCheckoutTotal(const Order& order) { return computeTotal(order); }
double computeInvoiceTotal(const Order& order) { return computeTotal(order); }
```

This follows DRY as:
* **Single, authoritative representation**: The discount logic exists in exactly one function.
* **Safe to change**: Updating the discount rate, or adding tax later, only requires touching `computeTotal`.

## Documentation duplication

Knowledge can also be duplicated between the code and the words describing
it, or between multiple documents describing the same thing.

### The "Not DRY" approach

```cpp
// This function takes a user's raw age in years (an int between 0 and 130)
// and a boolean flag telling us if they've opted into marketing emails,
// then returns true if the user is allowed to sign up for the newsletter,
// which requires the user to be at least 18 years old and opted in.
bool canSubscribeToNewsletter(int ageInYears, bool optedIntoMarketing) {
    return ageInYears >= 18 && optedIntoMarketing;
}
```

This is not DRY because:
* **The comment re-derives the rule**: "at least 18" and "opted in" are stated in prose *and* in code. If the minimum age changes to 16, the comment has to be edited too, and it's easy to forget.
* **Two places to get out of sync**: A reader trusting the comment over the code (or vice versa) can be misled the moment one of them is updated without the other.

### The DRY approach

```cpp
// Eligibility rules live only in code; names make the intent obvious.
constexpr int kMinimumNewsletterAge = 18;

// Returns whether the user meets the newsletter eligibility rules.
bool canSubscribeToNewsletter(int ageInYears, bool optedIntoMarketing) {
    return ageInYears >= kMinimumNewsletterAge && optedIntoMarketing;
}
```

This follows DRY as:
* **The code is the single source of truth**: A named constant replaces a duplicated fact, so the comment doesn't need to restate the rule.
* **Comments describe intent, not mechanics**: The comment says *what* the function answers, not a second copy of *how* it decides.

## Representational duplication

The same piece of knowledge often gets represented more than once across
boundaries: an internal API, an external API, and a datasource may all
define their own version of the "same" thing.

### The "Not DRY" approach

```cpp
// Internal domain model
struct UserRecord { int id; std::string fullName; std::string emailAddr; };

// Hand-written struct mirroring the external REST API's JSON shape
struct UserApiResponse { int userId; std::string name; std::string email; };

// Hand-written struct mirroring the database table's columns
struct UserRow { int user_id; std::string full_name; std::string email_address; };

// Someone has to manually keep these three shapes, and the field-by-field
// mapping code between them, in sync by hand.
UserApiResponse toApiResponse(const UserRecord& u) {
    return { u.id, u.fullName, u.emailAddr };
}

UserRecord fromDbRow(const UserRow& row) {
    return { row.user_id, row.full_name, row.email_address };
}
```

This is not DRY because:
* **The concept of "a user" is defined three times**: Once for the domain, once for the API contract, once for the schema, each with its own field names.
* **Adding a field means editing three (or more) places**: The struct, the mapping functions, and every caller that assumes the old shape, all by hand and all easy to miss one of.

### The DRY approach

```cpp
// One authoritative definition of "a user", generated or shared,
// e.g. from a schema file (protobuf/JSON Schema/SQL DDL) that both
// the API layer and the datasource layer are generated from or
// validated against, instead of being hand-duplicated.
struct User {
    int id;
    std::string fullName;
    std::string emailAddr;
};

// The API and datasource layers translate at their edges using the
// single shared type, rather than each owning a competing definition.
using UserApiResponse = User;
using UserRow = User;
```

This follows DRY as:
* **A single authoritative representation**: One schema (or one generated type) is the source of truth; the API and datasource layers consume it instead of redefining it.
* **Changes propagate instead of diverging**: Adding a field to the shared definition updates every layer that depends on it, rather than requiring N manual edits that can fall out of sync.

## Interdeveloper duplication

Duplication isn't only about files, it also happens between people. Two
developers can independently (re)implement the same piece of knowledge
because neither knew the other's version already existed.

### The "Not DRY" approach

```cpp
// utils_alice.h, written by Alice
inline std::string trimWhitespace(const std::string& s) {
    size_t start = s.find_first_not_of(" \t\n");
    size_t end = s.find_last_not_of(" \t\n");
    return (start == std::string::npos) ? "" : s.substr(start, end - start + 1);
}

// string_helpers.h, written months later by Bob, in a different module,
// who didn't know Alice's version existed.
inline std::string stripWhitespace(const std::string& input) {
    size_t begin = input.find_first_not_of(" \t\n");
    size_t last = input.find_last_not_of(" \t\n");
    return (begin == std::string::npos) ? "" : input.substr(begin, last - begin + 1);
}
```

This is not DRY because:
* **The same knowledge exists in two developers' heads and two files**: Alice and Bob each independently encoded "how to trim whitespace", with slightly different names and slightly different behavior waiting to diverge further.
* **A bug fix in one won't reach the other**: If an edge case (say, trimming `\r`) is fixed in `trimWhitespace`, `stripWhitespace` stays broken, and nobody is likely to notice the two are related.

### The DRY approach

```cpp
// A shared, discoverable "common" or "utils" library that the whole
// team is expected to check before writing a new helper function.
namespace common::strings {
    inline std::string trim(const std::string& s) {
        size_t start = s.find_first_not_of(" \t\n\r");
        size_t end = s.find_last_not_of(" \t\n\r");
        return (start == std::string::npos) ? "" : s.substr(start, end - start + 1);
    }
}

// Both Alice's and Bob's code call the same function.
// #include "common/strings.h"
// common::strings::trim(someInput);
```

This follows DRY as:
* **One team-wide authoritative representation**: `common::strings::trim` is the single place this knowledge lives, discoverable via code review, a shared library, or documentation, instead of living silently in one developer's head.
* **Fixes and improvements reach everyone**: A bug fix or edge case handled once benefits every caller across the team, rather than being scattered across near-duplicate implementations.

I highly recommend to check out and read the [book](https://pragprog.com/titles/tpp20/the-pragmatic-programmer-20th-anniversary-edition/). I just write some example snippets here explaining the important principles.
