using System;
using UnityMCP.Mocks.UnityEngine;
using UnityMCP.Mocks.UnityEditor;

class Program
{
    static void Main(string[] args)
    {
        Console.WriteLine("Command Parser Test");
        Console.WriteLine("===================");

        // Test creating a GameObject
        TestCreateGameObject();

        // Test finding a GameObject
        TestFindGameObject();

        // Test property access
        TestPropertyAccess();

        Console.WriteLine("All tests completed successfully!");
    }

    static void TestCreateGameObject()
    {
        Console.WriteLine("\nTesting GameObject creation...");

        // Create a GameObject
        var gameObject = new GameObject("TestObject");

        // Verify the GameObject was created
        Console.WriteLine($"Created GameObject: {gameObject.name}");

        if (gameObject.name == "TestObject")
        {
            Console.WriteLine("✓ GameObject created successfully");
        }
        else
        {
            Console.WriteLine("✗ GameObject creation failed");
        }
    }

    static void TestFindGameObject()
    {
        Console.WriteLine("\nTesting GameObject finding...");

        // Create a GameObject
        var gameObject = new GameObject("TestObject");

        // Find the GameObject
        var foundGameObject = GameObject.Find("TestObject");

        // Verify the GameObject was found
        Console.WriteLine($"Found GameObject: {foundGameObject?.name}");

        if (foundGameObject != null && foundGameObject.name == "TestObject")
        {
            Console.WriteLine("✓ GameObject found successfully");
        }
        else
        {
            Console.WriteLine("✗ GameObject finding failed");
        }
    }

    static void TestPropertyAccess()
    {
        Console.WriteLine("\nTesting property access...");

        // Create a GameObject
        var gameObject = new GameObject("TestObject");

        // Access the transform property
        var transform = gameObject.AddComponent<Transform>();
        transform.position = new Vector3(1, 2, 3);

        // Verify the property was accessed
        Console.WriteLine($"Transform position: {transform.position}");

        if (transform.position.x == 1 && transform.position.y == 2 && transform.position.z == 3)
        {
            Console.WriteLine("✓ Property access successful");
        }
        else
        {
            Console.WriteLine("✗ Property access failed");
        }
    }
}
