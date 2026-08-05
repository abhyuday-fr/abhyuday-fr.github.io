+++
date = '2026-08-05T21:28:46+05:30'
draft = false
title = 'Which Thread on Which CPU Core'
description = "Let's verify how the Linux scheduler assigns threads to CPU cores using C++."
tags = ['cpp', 'multithreading', 'linux', 'operating-systems', 'scheduler']
categories = ['Systems Programming']
+++

Let's suppose your computer has **4 CPU cores** and you decide to create **2 threads**.

Will they be created on the **same core** or on **different cores**?

It sounds like a simple question, and you might already know the answer.

But how do we actually **verify** that answer with code?

## Finding the Number of CPU Cores

C++ provides `std::thread::hardware_concurrency()`, which returns the number of hardware threads (logical CPUs) available to your program.

```cpp
// num-of-cores.cc
#include <thread>
#include <iostream>

int main() {
    std::cout << "This system's CPU has "
              << std::thread::hardware_concurrency()
              << " cores\n";
    return 0;
}
```

Compile and run:

```bash
g++ num-of-cores.cc -std=c++20 -pthread
./a.out
```

The output on my machine looks like this:

![Number of CPU cores](https://blogger.googleusercontent.com/img/a/AVvXsEgQBSkVCxD1bga3to8AgIn8z8ORM4mlYBTcgbKQlYygKCqjnbO0saNXMff02iB9kwhO69xT6X5VyBCdJxYuT47SpvG0-q0EJNpaFaXuhbXOBX5foiHSFx1azzg9OTcH2z8ReG0NKQO3N8Mpp-dI2hzZG8lbtyH5ZGuX0lhuKd29oWr6TH6bzXCV5YiYYXs)

> My machine reports **12 logical cores**.

---

## Finding Which Core a Thread Is Running On

Knowing how many CPU cores your machine has is nice, but the more interesting question is:

> **Which core is this thread running on?**

One of the easiest ways on Linux is to use the `<sched.h>` header and call `sched_getcpu()`.

```cpp
// this-core.cc
#include <iostream>
#include <sched.h>

int main() {
    std::cout << "This thread is running on core "
              << sched_getcpu()
              << "\n";
}
```

Compile and run:

```bash
g++ this-core.cc -std=c++20
./a.out
```

On my machine, I got:

![Current CPU core](https://blogger.googleusercontent.com/img/a/AVvXsEiorCN_o3_z7S0JBocXcBdi_MMhzdyBKzaNt1kAOEjDWjUbL7SFtvhOJTWLaaeHsDQQ8e6-Ke88MGynMnHrHj-RKrpgqX7Jj6lHReYv2kCYmIdVE3HvpCWM-zhrhn6TvWUnFDwAisu-PscaFMG79MEdv26klZ7dF_f_V4hbkKq2gly8-m9OoJfnv33cqgQ)

---

You probably already know what's coming next.

Let's create multiple threads and see which CPU cores they actually get assigned to.

## Creating Two Threads

```cpp
// which-core.cc
#include <chrono>
#include <iostream>
#include <mutex>
#include <sched.h>
#include <thread>

std::mutex mtx;

// The mutex keeps our output readable.
// Without it, multiple threads may print at the same time.

void tell_core() {
    std::lock_guard<std::mutex> lock(mtx);

    std::cout << "Thread id: "
              << std::this_thread::get_id()
              << " got core "
              << sched_getcpu()
              << "\n";

    std::this_thread::sleep_for(std::chrono::microseconds(300));
}

int main() {
    std::thread t1(tell_core);
    std::thread t2(tell_core);

    t1.join();
    t2.join();

    return 0;
}
```

Compile and run:

```bash
g++ which-core.cc -std=c++20 -pthread
./a.out
```

The output on my machine:

![Two threads on CPU cores](https://blogger.googleusercontent.com/img/a/AVvXsEg9hxkyvP0iHcNk8DcppT6CGH3mYPyWZu2gv5CmxPj0JTprmOKA36dcTG5817Qniqv8QIQeS-fuZYPoto47c9yW1nW9rp3kKw-GDvAJ7AgQ0As4lJnq9RKNIMEKqBxQREoC5ulltHZIcLqC43mqn9QSZdj6JMu66wSMMtSUVDB3N-GYkTndBNV01pWUAco)

Notice that the two threads may be running on different CPU cores.

If you execute the program multiple times, you'll likely notice that the assigned cores change from one run to another. That's because **the operating system's scheduler** decides where each thread runs, and it may even migrate a thread from one CPU core to another while the program is executing.

---

## Your Turn 🚀

Now it's your turn to experiment.

Instead of creating just two threads, create a **vector of threads** (or even better, a small thread pool) and try these three cases:

1. **Fewer threads than the number of CPU cores**
2. **Exactly as many threads as CPU cores**
3. **More threads than the number of CPU cores**

Run the program several times and observe how your operating system schedules the threads.

Some questions to think about:

- Does every thread get its own CPU core?
- What happens when there are more threads than cores?
- Do the same threads always run on the same cores?
- Can a thread move from one core to another?

I'd **love** to see your solutions.

If you get stuck, try searching the internet for answers—you'll probably discover even more interesting things along the way. (That's how many of us learn!)

And of course, you're always welcome to ask questions here.

Hope you had a great time reading this. :)
