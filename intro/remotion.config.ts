/**
 * Node.JS API 로 부를 때는 이 파일이 아니라 인자가 쓰인다.
 * 설정 전체: https://remotion.dev/docs/config
 */

import { Config } from "@remotion/cli/config";

Config.setRspack(true);
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setDefaultPremountInSeconds(2);
