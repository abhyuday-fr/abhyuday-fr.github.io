+++
date = '2026-09-09T10:58:15+05:30'
draft = false
comments = true
title = 'Branchless & Cache friendly programming'
description = "This post discusses how we can write code (mainly focused to C++ but can be applied in almost any language) in such a way that it follows branchless-ness and spacial locality"
tags = ['cpp', 'coding', 'low-latency', 'best-practices']
categories = ['Low-Latency']
+++

[branch prediction](https://www.sciencedirect.com/topics/computer-science/branch-prediction) and [spacial locality](https://www.sciencedirect.com/topics/computer-science/spatial-locality) deserve a post of their own but I don't intend to explain "what" they are in details so you can refer the links later to understand about them in details.

## Branchless Programming

### 1. The Boolean Arithmetic Trick
In C++, a boolean expression evaluates to exactly 1 (true) or 0 (false). You can use this to do math without ever writing an if statement.

**The branching way (bad for prediction)**:
```cpp
// if the array is unsorted, the CPU guesses wrong 50% of the time.
int count = 0;
for (int i = 0; i < 100000; i++) {
    if (data[i] >= 128) {
        count++;
    }
}
```

**The branchless way (fast)**:
```cpp
int count = 0;
for (int i = 0; i < 100000; i++) {
    // the CPU evaluates the condition and adds 1 or 0. No jumping required.
    count += (data[i] >= 128); 
}
```

This forces the CPU to evaluate the condition and store the result, completely eliminating the conditional jump instruction and guaranteeing zero pipeline flushes.

### 2. Use the Ternery Operator (for `cmov`)
When you need to assign a value based on a condition, rely on the ternary operator ? : instead of an if/else block.
Modern compilers (like GCC or Clang) are smart enough to translate ternary operators into a special x86 assembly instruction called `cmov` (Conditional Move).

```cpp
// instead of this:
int max_val;
if (a > b) {
    max_val = a;
} else {
    max_val = b;
}

// do this:
int max_val = (a > b) ? a : b;
```

A `cmov` instruction acts like a normal assignment, but it only commits the result if a flag is set. It executes unconditionally, meaning the branch predictor isn't involved at all.

### 3. Sort your data (if you must branch)
Sometimes you can't avoid an if statement. If the condition depends on the data (like filtering an array), sort the data first.
If an array of random numbers is sorted before you loop through it to find values > 128, the condition will evaluate to false for the first half of the array, and true for the second half.

**Important Note** : Sorting takes O(N log N) time complexity at best and iterating over the array takes O(N). So, compromising it for branchless prog. is only good in some scenarios like...

#### Scenario A : "Write-Once, Read-Many"
If you sort the array once, but then run your O(N) filtering loop over it 1,000 times throughout the lifetime of your application, the math flips.
You pay the O(N log N) sorting cost upfront, but you save those misprediction cycles every single time you read it. This is the foundational concept behind database indexing and 3D rendering engines. You organize the data heavily on initialization so the "hot loop" runs *flawlessly*.

#### Scenario B : Complex Payloads
Branchless tricks like `count += (data[i] >= 128)` or `cmov` only work for simple assignments or basic math. But what if the condition triggers a massive block of code?
```cpp
if (data[i] > threshold) {
    // Branchless tricks cannot help you here:
    allocate_memory();
    update_network_state();
    write_to_disk();
}
```

You cannot use a ternary operator or boolean arithmetic to conditionally allocate memory or write to a disk. You must use an if statement. If this array is unsorted, the CPU will constantly stall and flush the pipeline. By sorting the array first, all the elements that trigger this heavy function are grouped together, allowing the CPU to pipeline the heavy execution *flawlessly*.

#### Scenario C : Early Exit
If your data is unsorted, you must check every single element in the array to find what you want (O(N)).If you sort the data, you can often stop iterating completely. If you are looking for values < 128, the moment you hit the first 129, you can break out of the loop.Not only does sorting give you perfect branch prediction while you iterate, it changes your execution time from O(N) to a fraction of that size.

### 4. Lookup Tables over Switch Statements
Long switch statements or massive if/else if chains are notoriously hard for the CPU to predict because there are multiple potential jump targets. You can often replace the logic entirely with a simple array index.

**The branching way**:
```cpp
int getStatusLevel(int code) {
    if (code == 0) return 10;
    if (code == 1) return 25;
    if (code == 2) return 50;
    return 0;
}
```

**The branchless way**:
```cpp
const int status_levels[] = {10, 25, 50};

int getStatusLevel(int code) {
    // zero branches. Just a direct memory lookup
    return status_levels[code]; 
}
```

### 5. C++20 `[[likely]]` and `[[unlikely]]`
If you are writing an application where a branch is heavily skewed (like error handling), you can explicitly tell the compiler what to expect.

Introduced in C++20, these attributes don't change the hardware's branch predictor, but they tell the compiler to arrange the compiled assembly code so that the "likely" path falls sequentially in memory. This improves instruction *cache locality*.

```cpp
for (size_t i = 0; i < size; ++i) {
    if (data[i] == 0) [[unlikely]] {
        // handle rare error case
        handle_corruption();
    } else [[likely]] {
        // main execution path
        process(data[i]);
    }
}
```

## Cache-Friendly programming

### 1. Loop Iteration Order (Row-Major vs. Column-Major)
In C and C++, 2D arrays are stored in row-major order. This means row 0 is laid out linearly in memory, followed immediately by row 1, then row 2.
If you traverse the array incorrectly, you destroy spatial locality.

**Cache-Thrashing way (column-major)**
```cpp
for (int col = 0; col < 1000; col++) {
    for (int row = 0; row < 1000; row++) {
        sum += matrix[row][col]; 
    }
}
```

the CPU pulls a 64-byte cache line to read `matrix[0][0]`. But the next iteration reads `matrix[1][0]`, which is thousands of bytes away. That forces a completely new memory fetch (a cache miss). The 63 other bytes fetched in the first step are totally wasted.

**Cache-Friendly way (row-major)**
```cpp
for (int row = 0; row < 1000; row++) {
    for (int col = 0; col < 1000; col++) {
        sum += matrix[row][col];
    }
}
```

### 2. Struct Memory Ordering (Padding)
When you define a struct or class, the compiler automatically inserts empty bytes (padding) between variables to align them nicely for the CPU. Unoptimized structs can bloat the size of your objects, severely reducing how many objects fit into a single cache line.

**The bloated struct**:
```cpp
struct BadEntity {
    bool isAlive;    // 1 byte
                     // + 7 bytes of invisible padding
    double health;   // 8 bytes
    short level;     // 2 bytes
                     // + 6 bytes of invisible padding
}; // total size: 24 bytes
```

this happens because CPU reads and stores in particular words size.

**The dense struct** : The golden rule is to order struct members from **largest to smallest**.
```cpp
struct GoodEntity {
    double health;   // 8 bytes
    short level;     // 2 bytes
    bool isAlive;    // 1 byte
                     // + 5 bytes padding at the end (to align the next object in an array)
}; // total size: 16 bytes
```

By simply reordering the variables, the struct went from 24 bytes to 16 bytes. You can now fit 4 of these entities into a single 64-byte cache line instead of 2.

### 3. Hot/Cold Data Splitting
n large systems, objects often contain a mix of data that is accessed constantly ("hot" data, like positions or health) and data that is accessed rarely ("cold" data, like display names or debug flags).
If you keep cold data inside the main struct, it pollutes the cache.

**The cache-polluting way**
```cpp
struct Player {
    // hot data
    float x, y, z;
    int health;
    
    // cold data
    char displayName[32]; // 32 bytes taking up half the cache line!
    char clanName[16];
};
```

**The cache-friendly way**
```cpp
struct PlayerColdData { // separate hot and cold data
    char displayName[32];
    char clanName[16];
};

struct Player {
    float x, y, z;
    int health;
    
    // pointer is only 8 bytes, we only fetch the ColdData when needed.
    PlayerColdData* coldData; 
};
```

### 4. Use Smaller Data Types
When developers need an integer, the default instinct is to type int (4 bytes) or long (8 bytes). But if you are tracking something like "player level" that will never exceed 100, a 4-byte integer is a waste of 3 bytes.

Use `#include <cstdint>` to use explicit sizes:
 - `int8_t` or `uint8_t` (1 byte)
 - `int16_t` or `uint16_t` (2 bytes)

If you replace four int variables with four int8_t variables, you just saved 12 bytes per object. Across an array of 100,000 objects, that is a massive reduction in RAM fetches.

### 5. Data-Oriented Design (DOD)
The ultimate expression of cache locality is ditching Object-Oriented Programming (OOP) in performance-critical loops.

Instead of an array of complex Monster objects with virtual functions (which require unpredictable memory jumps via virtual tables), you break the Monster down into raw arrays of components (SoA): one array for positions, one for velocities, one for health. You then write a single loop that iterates over the velocities array and updates the positions array.

**NOTE** : Data Oriented Design is way more than just AOSs vs SOAs. I may post a seprate blog just dedicated to it, till then you can check out [**these**](https://gist.github.com/debasishg/6e50af45be46ef61e9a6eed97fe09daf) as they are one of the best compiled resources for DOD.

## Your points, views and tips
I've barely scratched the surface or been only a lil deep into the topics. The links for the brief topics are scattered across the post but I am giving the links at the bottom to make it easy for ya.
If you have some tips, tricks and knowledge that you feel are worth sharing then please feel welcome to do so in the comments/discussions :)

## Links for deep dive of topics
1. [**Branch Predcition**](https://www.sciencedirect.com/topics/computer-science/branch-prediction) 
2. [**Spacial Locality**](https://www.sciencedirect.com/topics/computer-science/spatial-locality)
3. [**Data Oriented Design**](https://gist.github.com/debasishg/6e50af45be46ef61e9a6eed97fe09daf) 
