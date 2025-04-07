using Autofac;
using UnityMCP.Client.Config;
using UnityMCP.Client.Services;

namespace UnityMCP.Client.DI
{
    /// <summary>
    /// Autofac module for registering services
    /// </summary>
    public class ServiceModule : Module
    {
        private readonly AppConfig _appConfig;

        /// <summary>
        /// Constructor
        /// </summary>
        /// <param name="appConfig">Application configuration</param>
        public ServiceModule(AppConfig appConfig)
        {
            _appConfig = appConfig;
        }

        /// <summary>
        /// Register dependencies
        /// </summary>
        /// <param name="builder">Container builder</param>
        protected override void Load(ContainerBuilder builder)
        {
            // Register services
            builder.RegisterType<LogService>()
                .As<ILogService>()
                .WithParameter("maxLogCount", _appConfig.MaxLogCount)
                .SingleInstance();

            // Register the code execution service factory
            builder.RegisterType<CodeExecutionServiceFactory>()
                .AsSelf()
                .SingleInstance();

            // Register the appropriate code execution service based on configuration
            if (_appConfig.CodeExecutionServiceType == "Mock")
            {
                builder.RegisterType<MockCodeExecutionService>()
                    .As<ICodeExecutionService>()
                    .SingleInstance();
            }
            else
            {
                // When we have a real Unity implementation, register it here
                builder.RegisterType<MockCodeExecutionService>()
                    .As<ICodeExecutionService>()
                    .SingleInstance();
            }
        }
    }
}
