+++
date = '2026-08-29T09:37:17+05:30'
draft = false
comments = true
title = 'Packing & Unpacking two integers in one'
description = "Packing and unpacking two integers into one is a bit manipulation technique used to compress multiple small values into a single larger variable to save memory or bandwidth."
tags = ['cpp', 'coding', 'programming' , 'low-latency']
categories = ['Low-Latency']
+++

## Simple Example

We will look at simple example of
```cpp
#include <cstdint>
#include <cstdlib>
#include <iostream>

int main() {
  uint16_t first{};
  uint16_t second{};

  std::cout << "enter first and second values of unsigned integers "
               "respectively (max is "
            << UINT16_MAX << ")\n";

  std::cin >> first >> second;

  uint32_t data{};
  data = ((uint16_t)first << 16) | ((uint16_t)second);

  std::cout << "First value is " << (data >> 16) << '\n';
  std::cout << "Second value is " << (data & 0xFFFF) << '\n';

  return EXIT_SUCCESS;
}
```

## Packing

consider this line...
```cpp
uint32_t data = ((uint16_t)first << 16) | ((uint16_t)second);
```

To get a big picture of what's happening, let's take an example
- We input 1000 in `first` and 2000 in `second`. In *hexadecimal*, they will be `0x3e8` and `0x7d0` respectively.
- `data` is initially `0x0` (all bits zeroes).
- `(uint16_t)first << 16` typecasts `first` to 16 bits int (which already is) and left shifts the whole to 16 bits.
  So, `data` becomes `0x3e800000`.
- Then almost immediately we perform bitwise OR with `second` to the result. So, `data` finally becomes `0x3e807d0`.

You can see that both the integers are **packed** inside another integer.

## Unpacking

now consider this line...
```cpp
(data >> 16)
```

and

```cpp
(data & 0xFFFF) // 0xFFFF is same as 0x0000FFFF
```

- To get the first value, we move the first 16 bits to the lowest 16 bits position by performing right shift.
  So we get the `0x3e8` back which is our `first` variable!!
- To get the second value, we isolate the last 16 bits, discarding the rest by performing bitwise AND with 0x0000FFFF.
  This results with `0x7d0` which is in fact our `second` variable ;)

## Real-life examples where this is used
1. **Concurrent open ports scanner (with epoll)** : I myself have used this trick at around line 113 [here](https://github.com/abhyuday-fr/Low-Level-CPP/blob/main/knocker/knocker-epoll.cc) to pack file descriptor and port together so I can use them later on around line 130.

2. **Linux Kernel's Device Numbers (dev_t)** : In this [code](https://github.com/torvalds/linux/blob/master/include/linux/kdev_t.h) around line 10, the Major and Minor numbers are stored together in `dev_t` but they are 12 and 20 bits respectively.

3. **Hardware Page Table Entries (PTE)** : Around the top in this [code](https://github.com/torvalds/linux/blob/master/arch/x86/include/asm/pgtable_types.h), you will see macros for page bits. When an operating system maps virtual memory to physical memory, it uses a hardware data structure called a Page Table. Because there are millions of pages in memory, the entries must be as small as possible. the bottom 12 bits of a physical page address are always zero. The hardware repurposes those 12 empty bits to pack boolean status flags.

4. **Network Protocols (IPv4 Headers)** : In the `struct iphdr` in the [code](https://github.com/torvalds/linux/blob/master/include/uapi/linux/ip.h), you will notice something interesting here: the kernel actually defines the ihl (Internet Header Length) and version bit-fields in a different order depending on whether the system's CPU is little-endian (like x86) or big-endian (like ARM/PowerPC). The kernel uses C struct bit-fields or manual bitwise operations to assemble this 32-bit word perfectly before sending it down to the network interface card.
