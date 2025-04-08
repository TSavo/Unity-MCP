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
            // Register the base log service
            builder.RegisterType<LogService>()
                .Named<ILogService>("baseLogService")
                .WithParameter("maxLogCount", _appConfig.MaxLogCount)
                .SingleInstance();

            // Register the security decorator for the log service
            builder.RegisterType<SecurityLoggingDecorator>()
                .Named<ILogService>("securityLogService")
                .WithParameter(
                    (pi, ctx) => pi.Name == "decorated",
                    (pi, ctx) => ctx.ResolveNamed<ILogService>("baseLogService"))
                .SingleInstance();

            // Register the performance decorator for the log service
            builder.RegisterType<PerformanceLoggingDecorator>()
                .As<ILogService>()
                .WithParameter(
                    (pi, ctx) => pi.Name == "decorated",
                    (pi, ctx) => ctx.ResolveNamed<ILogService>("securityLogService"))
                .SingleInstance();

            // Register the base code execution service based on configuration
            if (_appConfig.CodeExecutionServiceType == "Mock")
            {
                builder.RegisterType<MockCodeExecutionService>()
                    .Named<ICodeExecutionService>("baseCodeExecutionService")
                    .SingleInstance();
            }
            else if (_appConfig.CodeExecutionServiceType == "Editor")
            {
                // Register the Editor implementation
                builder.RegisterType<EditorCodeExecutionService>()
                    .Named<ICodeExecutionService>("baseCodeExecutionService")
                    .SingleInstance();
            }
            else
            {
                // Default to the Editor implementation
                builder.RegisterType<EditorCodeExecutionService>()
                    .Named<ICodeExecutionService>("baseCodeExecutionService")
                    .SingleInstance();
            }

            // Register the security decorator for the code execution service
            builder.RegisterType<SecurityCodeExecutionDecorator>()
                .Named<ICodeExecutionService>("securityCodeExecutionService")
                .WithParameter(
                    (pi, ctx) => pi.Name == "decorated",
                    (pi, ctx) => ctx.ResolveNamed<ICodeExecutionService>("baseCodeExecutionService"))
                .SingleInstance();

            // Register the logging decorator for the code execution service
            builder.RegisterType<LoggingCodeExecutionDecorator>()
                .Named<ICodeExecutionService>("loggingCodeExecutionService")
                .WithParameter(
                    (pi, ctx) => pi.Name == "decorated",
                    (pi, ctx) => ctx.ResolveNamed<ICodeExecutionService>("securityCodeExecutionService"))
                .SingleInstance();

            // Register the caching decorator for the code execution service
            builder.RegisterType<CachingCodeExecutionDecorator>()
                .As<ICodeExecutionService>()
                .WithParameter(
                    (pi, ctx) => pi.Name == "decorated",
                    (pi, ctx) => ctx.ResolveNamed<ICodeExecutionService>("loggingCodeExecutionService"))
                .WithParameter(
                    (pi, ctx) => pi.Name == "cacheDurationSeconds",
                    (pi, ctx) => 60)
                .SingleInstance();
        }
    }
}
