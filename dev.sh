unset http_proxy
unset https_proxy
unset HTTP_PROXY
unset HTTPS_PROXY

subcmd=${1:-"dev"}
# and rest arguments
shift
yarn wrangler $subcmd $@
