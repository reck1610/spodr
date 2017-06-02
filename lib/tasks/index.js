"use strict";

module.exports = {
	check     : require( "./task.check" ),
	clean     : require( "./task.clean" ),
	create    : require( "./task.create" ),
	linkdep   : require( "./task.pm.linkdep" ),
	pmInstall : require( "./task.pm.install.js" ),
	pmLink    : require( "./task.pm.link.js" ),
	push      : require( "./task.push.js" ),
	status    : require( "./task.status" ),
	update    : require( "./task.update" ),
	gitStatus : require( "./task.git-status" )
};
