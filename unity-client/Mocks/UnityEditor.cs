using System;
using System.Collections.Generic;
using UnityMCP.Mocks.UnityEngine;

namespace UnityMCP.Mocks.UnityEditor
{
    // Mock implementation of UnityEditor classes for building without Unity

    public class EditorWindow
    {
        public static T GetWindow<T>() where T : EditorWindow, new()
        {
            return new T();
        }

        public void Show()
        {
            Console.WriteLine($"[EDITOR] Showing window: {GetType().Name}");
        }
    }

    public class EditorApplication
    {
        public static bool isPlaying { get; set; }

        public static event Action delayCall;

        public static void InvokeDelayCall()
        {
            delayCall?.Invoke();
        }
    }

    [AttributeUsage(AttributeTargets.Class)]
    public class InitializeOnLoadAttribute : Attribute
    {
    }

    [AttributeUsage(AttributeTargets.Method)]
    public class MenuItemAttribute : Attribute
    {
        public MenuItemAttribute(string menuItem)
        {
        }
    }

    public enum PlayModeStateChange
    {
        EnteredEditMode,
        ExitingEditMode,
        EnteredPlayMode,
        ExitingPlayMode
    }

    public static class EditorPrefs
    {
        private static Dictionary<string, bool> boolPrefs = new Dictionary<string, bool>();
        private static Dictionary<string, string> stringPrefs = new Dictionary<string, string>();
        private static Dictionary<string, float> floatPrefs = new Dictionary<string, float>();
        private static Dictionary<string, int> intPrefs = new Dictionary<string, int>();

        public static bool GetBool(string key, bool defaultValue = false)
        {
            if (boolPrefs.TryGetValue(key, out bool value))
            {
                return value;
            }
            return defaultValue;
        }

        public static void SetBool(string key, bool value)
        {
            boolPrefs[key] = value;
        }

        public static string GetString(string key, string defaultValue = "")
        {
            if (stringPrefs.TryGetValue(key, out string value))
            {
                return value;
            }
            return defaultValue;
        }

        public static void SetString(string key, string value)
        {
            stringPrefs[key] = value;
        }

        public static float GetFloat(string key, float defaultValue = 0f)
        {
            if (floatPrefs.TryGetValue(key, out float value))
            {
                return value;
            }
            return defaultValue;
        }

        public static void SetFloat(string key, float value)
        {
            floatPrefs[key] = value;
        }

        public static int GetInt(string key, int defaultValue = 0)
        {
            if (intPrefs.TryGetValue(key, out int value))
            {
                return value;
            }
            return defaultValue;
        }

        public static void SetInt(string key, int value)
        {
            intPrefs[key] = value;
        }
    }
}
