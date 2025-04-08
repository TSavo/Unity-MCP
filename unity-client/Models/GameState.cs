namespace UnityMCP.Client.Models
{
    /// <summary>
    /// Represents the current state of the game
    /// </summary>
    public class GameState
    {
        /// <summary>
        /// Whether the game is currently playing
        /// </summary>
        public bool IsPlaying { get; set; }

        /// <summary>
        /// Whether the game is currently paused
        /// </summary>
        public bool IsPaused { get; set; }

        /// <summary>
        /// Whether the game is currently compiling
        /// </summary>
        public bool IsCompiling { get; set; }

        /// <summary>
        /// The name of the current scene
        /// </summary>
        public string CurrentScene { get; set; } = string.Empty;

        /// <summary>
        /// The current time scale
        /// </summary>
        public float TimeScale { get; set; }

        /// <summary>
        /// The current frame count
        /// </summary>
        public int FrameCount { get; set; }

        /// <summary>
        /// The time since the game started
        /// </summary>
        public float RealtimeSinceStartup { get; set; }
    }
}
