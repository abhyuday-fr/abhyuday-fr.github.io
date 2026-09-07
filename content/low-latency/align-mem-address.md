+++
date = '2026-09-07T11:11:55+05:30'
draft = false
comments = true
title = 'Strcitly Align Memory Address'
description = "We can use bitwise operations and tricks to ensure that memory addresses are strictly aligned for performance and hardware safety."
tags = ['cpp', 'memory', 'low-latency']
categories = ['Low-Latency']
+++

## Main Idea

This is a very common technique in systems programming and memory allocators. 
Consider these macros below
```c
#define ALIGN(sizeof(void*))
#define ALIGN_UP_POW2(x, align) (((x) + (align) - 1) & ~((align) - 1)) 
```

... further somewhere in program we have a custom allocator (like arena, free-list memory pools, etc.).
Let's just take a simple variable `x` and see what happens to it.

 ```c
uint64_t x =  ALIGN_UP_POW2(x, ALIGN);
```

Maybe you've seen all this for the first time and 

## Step-by-step explanation


1. Memory allocators usually align data to the size of a pointer so that CPU registers can read and write the memory efficiently.
	- On a **64-bit** machine, `sizeof(void *)` is **8**
  - On a **32-bit** machine, `sizeof(void *)` is **4**

2.  `(x, align) (((x) + (align) - 1) & ~((align) - 1))`
	- It *only* works if `align` is a power of 2 (that is the most important part)
	- `align - 1` : e.g., 8 - 1 = 7 (8 -> `1000` 7 -> `0111`)
	- `~((align) - 1)` : ~ flips the bit, so `0111` becomes `...111110000`. This creates a [bitmask](https://stackoverflow.com/questions/10493411/what-is-bit-masking) that, when applied to a number, clears the bottom 3 bits, effectively forcing the number to be a multiple of 8.

3. `(x) + (align) - 1` : we add 7 to the `x` which gives two possibilities
	- if `x` was already a multiple of 8 (e.g., 8), adding 7 makes it 15.
	- if `x` was one byte over (e.g., 9), adding 7 makes it 16.

4. The bitwise AND (`&`) : 1. we apply the mask from Step 2. This snaps the added value down to the nearest valid multiple of 8.

## Examples

- If `x` is 0:<br>
  `(0 + 7) & ~7` = `7 & ~7` = `0` (already aligned)
- If `x` is 1:<br>
  `(1 + 7) & ~7` = `8 & ~7` =`8` (rounded up)
- If `x` is 7:<br>
  `(7 + 7) & ~7` = `14 & ~7` = `8` (rounded up)
- If `x` is 8:<br>
  `(8 + 7) & ~7` = `15 & ~7` = `8` (already aligned, stays 8)
- If `x` is 9:<br>
  `(9 + 7) & ~7` = `16 & ~7` = `16` (Rounded up to the next boundary)


## Why even bother doing all this when we can use modulo and built-in functions?

If we wrote `x = ceil(x / 8.0) * 8` or used modulo `x + (8 - (x % 8))`, the CPU would have to execute division instructions. Division can take 10 to 40 times longer for a CPU to execute than basic arithmetic.

By using +, -, and bitwise operations the alignment is calculated in a single CPU cycle.

## Real life projects where this is used

This specific bitwise trick is one of the most ubiquitous and famous macros in all of systems programming.

1. **ReinC** :  I've used in the [Reinforcement Library](https://github.com/abhyuday-fr/Low-Level/blob/main/ReinC/arena.c) I made in C at approx line `34` to algin the memory addresses in the arena allocator I made in it.
You can just do `go to definition` to see the macros

2. **Linux Kernel** : The [Linux kernel](https://github.com/torvalds/linux/blob/master/include/vdso/align.h) uses this exact logic everywhere from memory management and network packet routing to file system drivers. In the kernel source code, it is primarily defined in include/linux/align.h (and historically in kernel.h). The kernel breaks it down into a few nested macros to handle type safety, but the underlying math is identical

3. **PostgreSQL** : [PostgreSQL](https://github.com/postgres/postgres/blob/master/src/include/c.h) uses this for aligning data types and memory buffers in its core C header.

4. **GNU C Library (glibc)** : The standard C library for Linux uses this in its memory allocator ([malloc](https://github.com/bminor/glibc/blob/master/malloc/malloc.c)). glibc abstracts the math into a macro called ALIGN_UP.

5. **FreeRTOS (Embedded Systems)** : [FreeRTOS](https://github.com/FreeRTOS/FreeRTOS-Kernel/blob/main/portable/MemMang/heap_4.c) uses this heavily in its memory management implementations for microcontrollers (specifically when initializing the heap and slicing blocks of RAM).
