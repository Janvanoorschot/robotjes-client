"""A setuptools based setup module.

See:
https://packaging.python.org/guides/distributing-packages-using-setuptools/
https://github.com/pypa/sampleproject
"""

from setuptools import setup
import pathlib
from robotjes import version as robotjes_client_version
from robotjes import name as robotjes_client_name

here = pathlib.Path(__file__).parent.resolve()
long_description = (here / 'README.md').read_text(encoding='utf-8')
setup(
    name=f"{robotjes_client_name}",
    version=f"{robotjes_client_version}",
    description='Client package for the Robomind Academy Python course',
    long_description=long_description,
    long_description_content_type='text/markdown',
    url='https://github.com/Janvanoorschot/robotjes-client',
    author='Jan van Oorschot',
    author_email='info@robomindacademy.com',
    classifiers=[
        'Development Status :: 3 - Alpha',
        'Intended Audience :: Education',
        'Topic :: Education',
        'License :: OSI Approved :: GNU General Public License v3 (GPLv3)',
        'Programming Language :: Python :: 3.8',
    ],
    keywords='educational, learning, student, programming',
    python_requires='>=3.6, <4',
    packages=[
        'robotjes',
        'robotjes.bot',
        'robotjes.client',
        'robotjes.client.aui',
        'robotjes.local',
        'robotjes.sim',
        'robotjes.sim.success',
    ],
    install_requires=[
        'asciimatics',
        'requests',
        'pyparsing'
    ],
    scripts=[
        'bin/ascii_local_player',
        'bin/ascii_remote_player',
        'bin/cli_local_player',
        'bin/cli_remote_player',
    ],
    package_data={
        'sample/mazes': [
            'sample/mazes/default.map',
            'sample/mazes/findBeacon1.map',
        ],
        'sample/player': [
            'sample/player/player100.py',
            'sample/player/player102.py',
            'sample/player/player103.py',
        ],
    },
    project_urls={
        'Bug Reports': 'https://github.com/Janvanoorschot/robotjes-client/issues',
        'Source': 'https://github.com/Janvanoorschot/robotjes-client/',
    },
)
