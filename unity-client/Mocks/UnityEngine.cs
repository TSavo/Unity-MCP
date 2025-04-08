using System;
using System.Collections.Generic;

namespace UnityMCP.Mocks.UnityEngine
{
    // Mock implementation of UnityEngine classes for building without Unity

    public class Debug
    {
        public static void Log(object message) => Console.WriteLine($"[LOG] {message}");
        public static void LogWarning(object message) => Console.WriteLine($"[WARNING] {message}");
        public static void LogError(object message) => Console.WriteLine($"[ERROR] {message}");
    }

    public class GameObject
    {
        public string name;

        public GameObject(string name = "")
        {
            this.name = name;
        }

        public static GameObject Find(string name)
        {
            return new GameObject(name);
        }

        public T AddComponent<T>() where T : Component, new()
        {
            var component = new T();
            component.gameObject = this;
            return component;
        }
    }

    public class Component
    {
        public GameObject gameObject { get; internal set; }
    }

    public class Transform : Component
    {
        public Vector3 position { get; set; } = Vector3.zero;
    }

    public class MeshRenderer : Component
    {
    }

    public struct Vector2
    {
        public float x;
        public float y;

        public Vector2(float x, float y)
        {
            this.x = x;
            this.y = y;
        }

        public override string ToString() => $"({x}, {y})";
    }

    public struct Vector3
    {
        public float x;
        public float y;
        public float z;

        public Vector3(float x, float y, float z)
        {
            this.x = x;
            this.y = y;
            this.z = z;
        }

        public static Vector3 zero => new Vector3(0, 0, 0);

        public override string ToString() => $"({x}, {y}, {z})";
    }

    [AttributeUsage(AttributeTargets.Field)]
    public class SerializeFieldAttribute : Attribute
    {
    }

    public class SerializeField : SerializeFieldAttribute
    {
    }
}
