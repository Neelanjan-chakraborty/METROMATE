import common from './common';
import home from './home';
import route from './route';
import station from './station';
import stations from './stations';
import live from './live';
import bus from './bus';
import map from './map';
import saved from './saved';
import lib from './lib';
import onboarding from './onboarding';

/** Every UI string, by key. Add messages to the file for their area; keys must be unique across areas. */
export const MESSAGES = { ...common, ...home, ...route, ...station, ...stations, ...live, ...bus, ...map, ...saved, ...lib, ...onboarding };

export type MessageKey = keyof typeof MESSAGES;

/** Per-area catalogs, for the completeness tests. */
export const AREAS = { common, home, route, station, stations, live, bus, map, saved, lib, onboarding };
