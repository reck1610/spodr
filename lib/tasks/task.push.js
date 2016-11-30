"use strict";

const BaseTask   = require( "./_task" );
const GitWrapper = require( "./../git/git" );
const Promise    = require( "bluebird" );

class PushTask extends BaseTask {
	constructor( repository, config ) {
		super( repository, config );
	}

	process() {
		this.git = new GitWrapper( this.repoPath );
		this.git.prefix( this.repository.name );

		return this.git.push()
			.then( status => status.code === 0 );
	}
}

function taskFactory( folder ) {
	const task = new PushTask( folder );
	return task.process();
}

module.exports = taskFactory;