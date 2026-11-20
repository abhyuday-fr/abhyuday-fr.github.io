+++
date = '2026-11-20T09:29:31+05:30'
draft = false
comments = true
title = 'SOLID'
description = "Although I don't support abstractions but SOLID priniciples come in handy for a lot of backend applications"
tags = ['golang', 'solid', 'backend']
categories = ['essential coding priciples']
+++

# SOLID Principles: Writing Clean, Maintainable and Scalable Code

Writing code that works is one thing. Writing code that remains understandable, maintainable, and adaptable as a project grows is another.

As software becomes more complex, poorly structured code can become difficult to modify. A small change in one component might unexpectedly affect several other parts of the application.

This is where **SOLID principles** come into play.

SOLID is a collection of five object-oriented software design principles that help developers build maintainable, flexible, and loosely coupled software systems.

Let's understand each principle with simple examples.

## 1. Single Responsibility Principle (SRP)

**A class or module should have only one reason to change.**

This means a component should have one clearly defined responsibility.

Consider a user service that handles business logic, database operations, and email notifications.

```go
type UserService struct{}

func (s *UserService) CreateUser() {
    // Create user
}

func (s *UserService) SaveToDatabase() {
    // Database operations
}

func (s *UserService) SendEmail() {
    // Send welcome email
}
```

The problem is that this component has multiple responsibilities.

A better approach is to separate these responsibilities into dedicated components:

```go
type UserService struct{}
type UserRepository struct{}
type EmailService struct{}
```

Now, each component has a focused responsibility and can evolve independently.

## 2. Open/Closed Principle (OCP)

**Software entities should be open for extension but closed for modification.**

In simple terms, we should be able to introduce new functionality without repeatedly modifying existing, stable code.

For example, imagine a notification system that supports email notifications.

```go
type EmailNotifier struct{}

func (e EmailNotifier) Send(message string) {
    // Send email
}
```

Later, we want to support SMS notifications.

Instead of modifying the existing notification implementation, we can introduce an abstraction:

```go
type Notifier interface {
    Send(message string)
}

type EmailNotifier struct{}
type SMSNotifier struct{}

func (e EmailNotifier) Send(message string) {}
func (s SMSNotifier) Send(message string) {}
```

Now, new notification methods can be introduced by implementing the `Notifier` interface without changing the existing implementations.

## 3. Liskov Substitution Principle (LSP)

**Objects of a subtype should be usable wherever objects of their base type are expected without breaking the correctness of the program.**

In simpler terms, an implementation should honor the behavior promised by the abstraction it implements.

For example, consider an interface:

```go
type Storage interface {
    Save(data []byte) error
}
```

Any implementation of `Storage` should be capable of fulfilling the contract of saving data.

If an implementation unexpectedly rejects valid input or violates the documented behavior, it breaks the expectations of its consumers.

The important lesson is that implementing an interface is not just about matching method signatures. It is also about preserving the expected behavior and contract.

## 4. Interface Segregation Principle (ISP)

**Clients should not be forced to depend on interfaces they do not use.**

Consider a large interface:

```go
type Worker interface {
    Work()
    Eat()
    Sleep()
}
```

A component that only needs to perform work should not be forced to implement eating and sleeping methods.

Instead, split the interface into smaller, focused interfaces:

```go
type Worker interface {
    Work()
}

type Eater interface {
    Eat()
}

type Sleeper interface {
    Sleep()
}
```

Now, components can implement only the behaviors they actually need.

This principle is particularly relevant in Go, where small interfaces are generally preferred over large, general-purpose interfaces.

## 5. Dependency Inversion Principle (DIP)

**High-level modules should not depend on low-level modules. Both should depend on abstractions.**

Consider a service that directly depends on a concrete PostgreSQL repository:

```go
type UserService struct {
    repo *PostgresRepository
}
```

This tightly couples business logic to a specific database implementation.

Instead, introduce an interface:

```go
type UserRepository interface {
    GetUser(id int64) error
}

type UserService struct {
    repo UserRepository
}
```

Now, the service depends on an abstraction rather than a specific database implementation.

PostgreSQL, MySQL, or an in-memory repository can satisfy the same interface.

This makes the system easier to test, extend, and maintain.

## Quick Summary

| Principle | Core Idea |
|---|---|
| **S**ingle Responsibility | One responsibility per component |
| **O**pen/Closed | Extend behavior without modifying existing stable code |
| **L**iskov Substitution | Implementations must honor their abstraction's contract |
| **I**nterface Segregation | Prefer small, focused interfaces |
| **D**ependency Inversion | Depend on abstractions, not concrete implementations |

## Conclusion

SOLID principles are not strict rules that must be followed blindly. They are design guidelines that help us reason about how components should be structured and how they should interact.

Applying them thoughtfully can reduce unnecessary coupling, improve testability, and make software easier to evolve.

However, there is one thing worth remembering:

**Good software design is not about introducing more interfaces, classes, or abstractions. It is about introducing the right abstractions where they actually solve a problem.**
