#!/bin/bash
# Shell completion for app-asset-generator CLI
#
# Installation:
#   bash: echo "source /path/to/completions.sh" >> ~/.bashrc
#   zsh:  echo "source /path/to/completions.sh" >> ~/.zshrc

_app_asset_generator_completions() {
	local cur prev words cword
	_init_completion || return

	# Commands
	local commands="generate validate list-presets list-fonts list-platforms"

	# Global options
	local global_opts="--help --version --format --quiet"

	# Generate command options
	local generate_opts="--name --platforms --types --output -o --bg-type --bg-color --bg-gradient-type --bg-gradient-colors --bg-gradient-angle --bg-image --fg-type --fg-text --fg-color --fg-font --fg-font-source --fg-font-size --fg-svg --fg-svg-color --fg-image --icon-scale --splash-scale --dark-mode --dark-bg-color --preset --dry-run --no-zip"

	# Validate command options
	local validate_opts="--preset --bg-type --bg-image --fg-type --fg-svg --fg-image --fg-font --fg-font-source --format"

	# Known values for specific options
	case "${prev}" in
		--preset)
			COMPREPLY=($(compgen -W "default minimal gradient-modern" -- "${cur}"))
			return 0
			;;
		--platforms)
			COMPREPLY=($(compgen -W "ios android web ios,android ios,web android,web ios,android,web" -- "${cur}"))
			return 0
			;;
		--types)
			COMPREPLY=($(compgen -W "icon splash adaptive favicon icon,splash icon,adaptive icon,favicon splash,adaptive splash,favicon icon,splash,adaptive icon,splash,favicon icon,adaptive,favicon splash,adaptive,favicon icon,splash,adaptive,favicon" -- "${cur}"))
			return 0
			;;
		--bg-type)
			COMPREPLY=($(compgen -W "color gradient image" -- "${cur}"))
			return 0
			;;
		--bg-gradient-type)
			COMPREPLY=($(compgen -W "linear radial" -- "${cur}"))
			return 0
			;;
		--fg-type)
			COMPREPLY=($(compgen -W "text svg image" -- "${cur}"))
			return 0
			;;
		--fg-font-source)
			COMPREPLY=($(compgen -W "google system" -- "${cur}"))
			return 0
			;;
		--format)
			COMPREPLY=($(compgen -W "text json" -- "${cur}"))
			return 0
			;;
		--output|-o|--bg-image|--fg-svg|--fg-image)
			# File path completion
			_filedir
			return 0
			;;
	esac

	# Complete command names if no command yet
	if [[ ${cword} -eq 1 ]]; then
		COMPREPLY=($(compgen -W "${commands} ${global_opts}" -- "${cur}"))
		return 0
	fi

	# Get the command
	local command="${words[1]}"

	# Complete options based on command
	case "${command}" in
		generate)
			COMPREPLY=($(compgen -W "${generate_opts} ${global_opts}" -- "${cur}"))
			return 0
			;;
		validate)
			COMPREPLY=($(compgen -W "${validate_opts} ${global_opts}" -- "${cur}"))
			return 0
			;;
		list-presets|list-fonts|list-platforms)
			COMPREPLY=($(compgen -W "--format ${global_opts}" -- "${cur}"))
			return 0
			;;
	esac
}

# Register completion function
complete -F _app_asset_generator_completions app-asset-generator

# Also register for development commands
complete -F _app_asset_generator_completions bun dev
