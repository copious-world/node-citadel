# node-citadel

A nodejs module providing a class for communicating with a citadel.org groupware server

In keeping a small footprint for my website, I decided to use webcit and the citadel server. 

The citadel server provides sufficient functionality and has been well established for some time. 
I needed to capture message from my web page, e.g. contact, etc. And, I wanted to have a cleaner signup page,
among other things. So, I created small express.js services that needed to log into citadel and send commands.

After getting that to work, I decived to provide a method for each possible citadel call. 
Most of these calls are straight forward. There are some peculiarities with node.js and async programming that 
results in fairly different code from the **C** implementation found in the citadel command line interface.

This module is not yet fully tested and test programs still have to be made.
Any comments, usage, etc. will be helpful.

The nodejs interface is something that could be created fairly quickly. I am happy with being able to get features up
on my site quickly before seeking paid services for similar things which also come with intrusive marketing gimmics.

Also, there are longer term solutions that I may have pursued. But, life is not so cheap. Still, packages like citadel 
had their inceptions some time ago. Now, new modern ideas are being used to cobble up new corners of the web. Perhaps 
citadel will dovetail with these in the future.
