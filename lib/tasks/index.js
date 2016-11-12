"use strict";

module.exports = {
	create     : require( "./task.create" ),
	linkdep    : require( "./task.linkdep" ),
	npmInstall : require( "./task.npm.install.js" ),
	npmLink    : require( "./task.npm.link.js" ),
	npmPrune   : require( "./task.npm.prune.js" ),
	status     : require( "./task.status" ),
	update     : require( "./task.update" )
};
