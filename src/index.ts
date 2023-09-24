// Init environment variables
import dotenv from 'dotenv'
dotenv.config()

import path from 'path';
import fs from 'fs';
import { buildEnvConfig, EnvValues } from './config/env-config';
import { buildYamlConfig } from './config/yaml-config';
import buildApp from './server';
import { buildMetricsServer } from './metrics/metrics-server';
import { MetricsCollector } from './metrics/metrics-collector';

// Base consts
const metricPort = process.env.METRIC_PORT ? parseInt(process.env.METRIC_PORT) : 9672;
const serverPort = process.env.SERVER_PORT ? parseInt(process.env.SERVER_PORT) : 3672;
const mainHost = process.env.MAIN_HOST || '0.0.0.0';

async function start() {
    const envConfig = buildEnvConfig(process.env as EnvValues);
    const configFile = fs.readFileSync(path.resolve(__dirname, '../config.yml'), 'utf8');
    const yamlConfig = buildYamlConfig(configFile);
    const metricsServer = buildMetricsServer();
    const metricsCollector = new MetricsCollector(metricsServer);
    const app = buildApp(envConfig, yamlConfig, metricsCollector);
    try {
        await metricsServer.listen(metricPort, mainHost);
    } catch (err) {
        app.log.error('An error occurred when starting prometheus metrics server: ' + err);
        process.exit(1);
    }
    try {
        await app.listen(serverPort, mainHost);
    } catch (err) {
        app.log.error('An error occurred when starting BRP server: ' + err);
        process.exit(1);
    }
}

start();
