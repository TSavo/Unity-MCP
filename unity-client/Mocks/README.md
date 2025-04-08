# Unity Mock Implementations

This directory contains mock implementations of Unity classes for testing purposes. These mocks are used in the test projects to simulate Unity functionality without requiring the Unity Editor.

## Usage

The mock implementations are in the `UnityMCP.Mocks` namespace to avoid conflicts with the actual Unity classes. To use them in your test code, import the appropriate namespace:

```csharp
using UnityMCP.Mocks.UnityEngine;
using UnityMCP.Mocks.UnityEditor;
```

## Assembly Definition

The `UnityMCP.Mocks.asmdef` file ensures that these mock implementations are properly isolated from the actual Unity code. The assembly is marked as `autoReferenced: false` to prevent Unity from automatically referencing it in other assemblies.

## Testing

See the `Tests/CommandParser` directory for an example of how to use these mock implementations in a test project.
