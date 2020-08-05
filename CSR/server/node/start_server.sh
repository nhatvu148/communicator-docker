# Ensure our relative ops will work 
cd `dirname $0`

# Ensure our node is used. Had trouble with npm's --scripts-prepend-node-path 
node_install_dir=../../3rd_party/node
export PATH=$node_install_dir/bin:$PATH

$node_install_dir/bin/npm start -- $@
