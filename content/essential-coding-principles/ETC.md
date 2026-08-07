+++
date = '2026-08-07T20:03:11+05:30'
draft = false
comments = true
title = 'ETC'
description = "Easier To Change is an essential and the first principle mentioned in the book of 'The Pragmatic Programmer'."
tags = ['cpp', 'coding', 'programming', 'principles']
categories = ['Pragmatic Programmer Principles']
+++

As quoted in the book of [The Pragmatic Programmer](https://pragprog.com/titles/tpp20/the-pragmatic-programmer-20th-anniversary-edition/), "Good design is easier to change than bad design".

The book also mentions that ETC is a *value* and **NOT** a rule.
Values are things that help you make decisions: should I do this,
or that? When it comes to thinking about software, ETC is a
guide, helping you choose between paths. Just like all your
other values, it should be floating just behind your conscious
thought, subtly nudging you in the right direction.

# Example in code

Here are two code snippets of cpp, the first one shows the Bad or "Hard to change" approach while the second one goes with the ETC approach.

## The "Hard to change" approach

```cpp
#include <iostream>
#include <string>
#include <vector>

struct User { int id; std::string name; };

class ReportManager {
public:
    // This function does too many things and is hardcoded.
    void generateReport(const std::vector<User>& users) {
        std::string report = "ID,Name\n"; // Hardcoded CSV format
        
        for (const auto& user : users) {
            report += std::to_string(user.id) + "," + user.name + "\n";
        }
        
        // Hardcoded output destination
        std::cout << "Report Output:\n";
        std::cout << report;
    }
};
```

This is hard to change when:
* **Format Changes**: If you want to report in JSON or HTML, you'll have to rewrite the core logic of `generateReport`.
* **Destination Changes**: If you need to save the report to a file or send it over a network instead of printing to the console, you may need to modify the class.

## The "Easier to change" or "ETC" approach

```cpp
#include <iostream>
#include <string>
#include <vector>
#include <memory>

struct User { int id; std::string name; };

// Abstract the formatting (Easier to swap formats)
class Formatter {
public:
    virtual std::string format(const std::vector<User>& users) const = 0;
    virtual ~Formatter() = default;
};

class CsvFormatter : public Formatter {
public:
    std::string format(const std::vector<User>& users) const override {
        std::string out = "ID,Name\n";
        for (const auto& u : users) out += std::to_string(u.id) + "," + u.name + "\n";
        return out;
    }
};

class JsonFormatter : public Formatter {
public:
    std::string format(const std::vector<User>& users) const override {
        std::string out = "[\n";
        for (size_t i = 0; i < users.size(); ++i) {
            out += "  {\"id\":" + std::to_string(users[i].id) +
                   ", \"name\":\"" + users[i].name + "\"}";
            if (i + 1 < users.size()) out += ",";
            out += "\n";
        }
        out += "]\n";
        return out;
    }
};

// Abstract the output destination (Easier to swap destinations)
class OutputDevice {
public:
    virtual void write(const std::string& data) const = 0;
    virtual ~OutputDevice() = default;
};

class ConsoleOutput : public OutputDevice {
public:
    void write(const std::string& data) const override {
        std::cout << data;
    }
};

// The Core Manager (Doesn't care about format or destination)
class ReportManager {
private:
    std::unique_ptr<Formatter> formatter;
    std::unique_ptr<OutputDevice> output;

public:
    // Dependency Injection makes this incredibly easy to change
    ReportManager(std::unique_ptr<Formatter> f, std::unique_ptr<OutputDevice> o) 
        : formatter(std::move(f)), output(std::move(o)) {}

    void generateReport(const std::vector<User>& users) {
        std::string formattedData = formatter->format(users);
        output->write(formattedData);
    }
};

int main() {
    std::vector<User> data = {{1, "Alice"}, {2, "Bob"}};

    // We can change the entire behavior of the system without touching ReportManager
    ReportManager manager(
        std::make_unique<JsonFormatter>(), 
        std::make_unique<ConsoleOutput>()
    );

    manager.generateReport(data);
    return 0;
}
```

This follows ETC as:
* **Single Responsibility**: The duties are distributed and each one handles their own thing.
* **Decoupling**: You don't have to touch or risk breaking the existing working code.
* **Pluggable**: You can swap out the behaviour at runtime depending on configuration.

I highly recommend to check out and read the [book](https://pragprog.com/titles/tpp20/the-pragmatic-programmer-20th-anniversary-edition/). I just write some example snippets here explaining the important principles.
