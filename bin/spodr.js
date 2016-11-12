#!/usr/bin/env node

"use strict";

const errors = require( "./errors" );
const log    = require( "fm-log" ).module();

const app = require( "./app" );
app.boot()
	.then( () => {
		return app.start();
	} )
	.catch( errors.SpodrError, error => {
		log.error( error.message );
	} );
