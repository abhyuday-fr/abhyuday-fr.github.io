+++
date = '2026-09-20T19:21:09+05:30'
draft = false
comments = true
title = 'Max Threads possible on System'
description = "Let's see how many kernel threads your system can make before it simply.. cannot"
tags = ['cpp', 'multithreading', 'operating-systems']
categories = ['Multithreading']
+++

In this [post](https://abhyuday-fr.github.io/multithreading/which-thread-on-which-cpu-core/) we discussed how to check at which cpu core the thread got created. Here, we will discuss how many threads your system can make before it reaches a limit by *code*, what sets the limit and if we can change this limit or not.

## The code

Let's look into this piece by piece

### The core logic

```cpp
void idle_worker(std::atomic<bool>& keep_running){
  while(keep_running){
    std::this_thread::sleep_for(std::chrono::milliseconds(100));
  }
}
```

where `keep_running` is an *atomic* bool value.
A newly spawned thread runs this loop almost forever but, **most importantnly** we don't want the thread to use 100% of CPU so we put it to sleep. Alternatively we could use `std::this_thread::yield()` but it will still *thrash* the cpu as it simply tells the operating system scheduler: "I am done with my current time slice, let another thread run."

Because we are spawning thousands of threads that are all doing nothing but yielding to each other, the OS scheduler immediately puts them right back into the queue. The CPU is spends 100% of its time frantically context-switching between thousands of active threads.

### Spawning multiple(infinite) threads

```cpp
try{
  while(true){
    threads.emplace_back(idle_worker, std::ref(keep_running));
  }
}
```

we just create a stl vector of threads running the loop earlier in each one of them infinitely.

### Catching the system error

After the *limit* is reached, we will get a system error which we handle like this:

```cpp
catch(const std::system_error &e){
  threads.emplace_back(idle_worker, std::ref(keep_running));
}
```

### Stopping all threads and cleaning up after everything

In the same catch block, signal all the threads to stop and join them:

```cpp
keep_running = false;
for(std::thread &t : threads){
  if(t.joinable()){
    t.join;
  }
}
```

### Putting it all together

after applying all of the above to keep the program working and safe, it looks like this:

```cpp

#include <atomic>
#include <iostream>
#include <system_error>
#include <thread>
#include <vector>

void idle_worker(std::atomic<bool> &keep_running) {
  while (keep_running) {
    // std::this_thread::yield(); // prevent 100% usage during testing
    std::this_thread::sleep_for(std::chrono::milliseconds(100));
  }
}

int main() {
  std::vector<std::thread> threads;
  std::atomic<bool> keep_running(true);

  std::cout << "Probing maximum possible threads. Please wait\n";

  try {
    while (true) {
      threads.emplace_back(idle_worker, std::ref(keep_running));
    }
  } catch (const std::system_error &e) {
    std::cerr << "Failed to create more threads\n";
    std::cerr << "Error: " << e.what() << "\n";
    std::cerr << "Maximum threads created successfully: " << threads.size()
              << "\n";
  }

  // signal all threads to stop before attempting to join them
  keep_running = false;
  // clean up
  for (std::thread &t : threads) {
    if (t.joinable()) {
      t.join();
    }
  }

  return 0;
}
```

## What limits the Max Threads?

When this code finally throws a std::system_error (usually EAGAIN or ENOMEM), it is hitting one of three hard limits:

1. **Virtual Memory (Stack Size)**: Every thread requires a stack. On Linux, the default stack size is often 8MB. On a 32-bit system, you run out of address space at around ~300 threads. On 64-bit systems, RAM or swap space becomes the bottleneck.

2. **OS Thread Limits**: Operating systems cap the number of concurrent processes/threads a user can spawn to prevent fork bombs. On Linux, this is governed by `ulimit -u` (max user processes) and `kernel.threads-max`

3. **PID Exhaustion**: Every thread on Linux is technically a lightweight process and takes up a Process ID (PID). If the system hits the `kernel.pid_max` limit, it cannot create more threads.

## How to increase the maximum thread limit (and stack size)

Linux offers the most direct control over these parameters, which are the most common bottlenecks for the C++ code you were running.

### Linux

On Linux, limits are enforced at both the user level (`ulimit`) and the system/kernel level (`sysctl`)

- Temporarily (user) : Run `ulimit -u 64000` in your terminal (often requires root if increasing beyond the hard limit).

- Permanently (user) : Edit `/etc/security/limits.conf` and add/modify these lines.
```conf
* soft nproc 64000
* hard nproc 64000
```

- System-wide : Edit `/etc/sysctl.conf` to increase the kernel limits, then run `sudo sysctl -p` to apply.

and to change the stack size ...

- Temporarily : Run `ulimit -s 2048` to drop the stack size to 2 MB. If you run C++ program in this same terminal session, it will hit a much higher thread count before failing.

- Permanently : `Edit /etc/security/limits.conf`
```conf
* soft stack 2048
* hard stack 2048
```

### Windows

Windows does not have a strict kernel-level integer cap on the number of threads. Instead, the limit is entirely determined by available virtual memory and the stack size of each thread.
On Windows, stack size is baked into the executable itself during compilation, defaulting to 1 MB. You cannot change it globally via the OS. To change it, you must pass a linker flag when compiling the C++ code.

### MacOS

macOS actively resists user modifications to these core kernel limits on modern Apple Silicon and recent macOS versions, often requiring disabling System Integrity Protection (SIP) to make changes via `sudo nvram boot-args="....` This is **highly discouraged**.

To change the stack size, run `ulimit -s <value>` in the terminal before executing the program, though this generally only affects the main thread's stack.

## What's your default limit?

I ran this program on fedora linux with a 64-bit CISC cpu in HP Victus and got this output
```
Probing maximum possible threads. Please wait
Failed to create more threads
Error: Resource temporarily unavailable
Maximum threads created successfully: 18567
```

What did you get? Feel free to tell in the comments/discussions below :>
