+++
date = '2026-09-30T11:41:46+05:30'
draft = false
comments = true
title = 'Bump Allocator'
description = "Bump Allocation is the most basic implementation of a memory allocation I, and hopefully you, can/will think of."
tags = ['cpp', 'memory', 'leak-free']
categories = ['Memory Allocation']
+++

## Simple Idea

When you used `malloc(3)` and `calloc(3)` and similar allocators. This question might  have struck your mind at some point that how do allocators give us the memory to use?

Believe it or not, the basic idea is really really simple and we will implement a minimal version of it in this post.

## Writing a Bump allocator

The first step is to just initialize a big chunk of memory in advance so that we can access it to borrow some smaller chunks from it.

### 1. The Big Memory Chunk

We just allocate an array of size we may want to use throughout in our program.

```cpp
static unsigned char chunk[1024 * 1024];
```

That's it, this is the big memory chunk we use, `static` because we are not allocating on *heap* right now and the *stack* is too small and can overflow.
So we move the storage in the program's global/data segment (`.bss` section) where large buffers can safely reside without eating up stack space.

### 2. Setting up a pointer for accessing memory in the chunk

```cpp
static unsigned char *mem_ptr = chunk;
```

### 3. Allocation

Let's suppose we want to allocate something with some `size` in the memory chunk. We simply *bump* the pointer to that `size` in chunk and return the previous chunks that have been bumped.

```cpp
void *alloc(size_t size){
    void *p = mem_ptr;
    mem_ptr += size;
    return p;
}
```

This is it, as simple as it can be.

But, we have to check the boundary conditions so the pointer doesn't leave the big chunk we have allocated and corrupt the memory and/or result in undefined behavior.

So, we add this safe-guard at the starting inside `alloc`

```cpp
void *alloc(size_t size){
    if(mem_ptr + size > chunk + sizeof(chunk)){
        return nullptr;
    }

    // rest of the logic
}
```


### 4. Deallocation (emptying the whole big chunk of memory)

```cpp
void free(void){
    mem_ptr = chunk;
}
```

### 5. Using the allocator (example)

```cpp
int main(){

    void *p = alloc(10); // allocate 10 bytes

    free(); // free all

    return EXIT_SUCCESS;
}
```

## Heap Bump Allocation

Since you have got the basic idea of what is going on, here is the full leak-free implementation of the bump allocator for heap

```cpp
class BumpAllocator {
public:
  explicit BumpAllocator(size_t size) : capacity_(size), offset_(0) {
    memory_ = static_cast<unsigned char *>(std::malloc(size));
  }

  ~BumpAllocator() { std::free(memory_); }

  // disable copy constructor and assignment to prevent double free errors
  BumpAllocator(const BumpAllocator &) = delete;
  BumpAllocator &operator=(const BumpAllocator &) = delete;

  void *alloc(size_t size) {
    if (offset_ + size > capacity_) {
      return nullptr;
    }
    void *ptr = memory_ + offset_;
    offset_ += size;
    return ptr;
  }

  void reset() { offset_ = 0; }

private:
  unsigned char *memory_;
  size_t capacity_;
  size_t offset_;
};
```

### Using this Bump Allocator and reading

```cpp
struct Person { // will allocate this struct
  int id;
  char name[32];
};

int main() {
  BumpAllocator memory(1024 * 1024); // the big chunk in heap

  // allocating just a number (variable)
  int *num =
      (int *)memory.alloc(sizeof(int)); // see the similarity with malloc(3)
  *num = 42; // storing data into allocated int variable

  // allocating the struct
  Person *user = (Person *)memory.alloc(sizeof(Person));
  user->id = 101;
  std::strcpy(user->name, "ABCxyz");

  // reading data
  std::cout << "int variable: " << *num << '\n';
  std::cout << "user id: " << user->id << ", name: " << user->name << '\n';

  memory.reset();
}
```

and the output will be, you know it:
```
int variable: 42
user id: 101, name: ABCxyz
```

## Why use it?

Memory allocation is a very heavy and costly operation, and if you know how much allocation your program needs throughout its lifetime then this is really helpful as you call malloc(3) only once instead of calling it again and again at different moments of the program. Although, many applications use improved versions of this but this version alone can be used in many scenarios.

## Where it is generally used

1. Frame-Based systems (Game Engines and Graphics)

2. Event-Driven request lifecycles

3. Compilers and Parsing Pipelines

4. Embedded Systems and Microcontrollers

5. WebAssembly (wasm) Runtimes
