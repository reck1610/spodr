# spodr

## Commands

### `init` - Initializes a spodr environment

Clones all projects from a GitHub organization or GitLab group in the current working directory. The working directory 
will become a new spodr environment.

### Options

#### `--github <organization>`

Initialize the working directory from a GitHub organization. All repositories in the organization will be cloned.

#### `--gitlab <group>`

Initialize the working directory from a GitLab group. All repositories in the group will be cloned.

By default, `gitlab.com` is used as the host. If you want to clone the group from another host, use `--gitlab-host` to specify it.

## General CLI Options

### `--help`

Does nothing

### `--jobs <n>`, `-j <n>`

Runs `n` jobs concurrently, as available. Defaults to the number of available cores.

### `--force`, `-f`

Perform certain tasks that might be destructive.

### `--verbose`, `-v`

Excessive output.
