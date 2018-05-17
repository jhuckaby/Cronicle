{
  'variables': {
    "ENABLE_SSL%": "<!(node ../util/librdkafka-config-checker.js ENABLE_SSL)",
    "WITH_SASL_CYRUS%": "<!(node ../util/librdkafka-config-checker.js WITH_SASL_CYRUS)",
    "WITH_SASL_SCRAM%": "<!(node ../util/librdkafka-config-checker.js WITH_SASL_SCRAM)",
    "WITH_SNAPPY%": "<!(node ../util/librdkafka-config-checker.js WITH_SNAPPY)",
    "WITH_ZLIB%": "<!(node ../util/librdkafka-config-checker.js WITH_ZLIB)",
    "WITH_LZ4_EXT%": "<!(node ../util/librdkafka-config-checker.js WITH_LZ4_EXT)",
    "WITH_PLUGINS%": "<!(node ../util/librdkafka-config-checker.js WITH_PLUGINS)",
    "WITH_LIBDL%": "<!(node ../util/librdkafka-config-checker.js WITH_LIBDL)",
    "LIBRARY_INCLUDE_PATHS": "<!(node ../util/get-lib-dirs.js include)",
    "LIBRARY_DIRS": "<!(node ../util/get-lib-dirs.js)",
  },
  'targets': [
    {
      "target_name": "librdkafkacpp",
      "conditions": [
        [
          'OS=="win"',
          {
            'type': 'static_library',
            'msvs_version': '2013',
            'msbuild_toolset': 'v120',
            'actions': [
              {
                'action_name': 'nuget_restore',
                'inputs': [
                  '<(module_root_dir)/deps/librdkafka/win32/librdkafka.sln'
                ],
                'outputs': [ ],
                'action': ['nuget', 'restore', '<@(_inputs)']
              },
              {
                'action_name': 'build_dependencies',
                'inputs': [
                  '<(module_root_dir)/deps/librdkafka/win32/librdkafka.sln'
                ],
                'outputs': [
                  '<(module_root_dir)/deps/librdkafka/win32/outdir/v120/x64/Release/librdkafkacpp.lib',
                  '<(module_root_dir)/deps/librdkafka/win32/outdir/v120/x64/Release/librdkafka.lib'
                ],
                # Fun story export PATH="$PATH:/c/Program Files (x86)/MSBuild/12.0/Bin/"
                # I wish there was a better way, but can't find one right now
                'action': ['msbuild', '<@(_inputs)', '/p:Configuration="Release"', '/p:Platform="x64"', '/t:librdkafkacpp']
              }
            ],
            'copies': [
              {
                'files': [
                  '<(module_root_dir)/deps/librdkafka/win32/outdir/v120/x64/Release/zlib.dll',
                  '<(module_root_dir)/deps/librdkafka/win32/outdir/v120/x64/Release/librdkafka.dll',
                  '<(module_root_dir)/deps/librdkafka/win32/outdir/v120/x64/Release/librdkafkacpp.dll'
                ],
                'destination': '<(module_root_dir)/build/Release'
              }
            ],
            'libraries': [
              '<(module_root_dir)/deps/librdkafka/win32/outdir/v120/x64/Release/librdkafkacpp.lib',
              '<(module_root_dir)/deps/librdkafka/win32/outdir/v120/x64/Release/librdkafka.lib'
            ],
            'build_files': [
              '<(module_root_dir)/deps/librdkafka/win32/outdir/v120/x64/Release/zlib.dll',
              '<(module_root_dir)/deps/librdkafka/win32/outdir/v120/x64/Release/librdkafka.dll',
              '<(module_root_dir)/deps/librdkafka/win32/outdir/v120/x64/Release/librdkafkacpp.dll',
            ],
            'msvs_settings': {
              'VCCLCompilerTool': {
                'AdditionalUsingDirectories': [
                  '<(module_root_dir)/deps/librdkafka/win32/outdir/v120/x64/Release/'
                ]
              }
            },
            'sources': [
              'win.cc'
            ]
          },
          {
            "type": "static_library",
            "include_dirs": [
              "librdkafka/src-cpp",
              "librdkafka/src"
            ],
            "dependencies": [
              "librdkafka"
            ],
            'sources': [
              'librdkafka/src-cpp/RdKafka.cpp',
              'librdkafka/src-cpp/ConfImpl.cpp',
              'librdkafka/src-cpp/HandleImpl.cpp',
		          'librdkafka/src-cpp/ConsumerImpl.cpp',
              'librdkafka/src-cpp/ProducerImpl.cpp',
              'librdkafka/src-cpp/KafkaConsumerImpl.cpp',
		          'librdkafka/src-cpp/TopicImpl.cpp',
              'librdkafka/src-cpp/TopicPartitionImpl.cpp',
              'librdkafka/src-cpp/MessageImpl.cpp',
		          'librdkafka/src-cpp/QueueImpl.cpp',
              'librdkafka/src-cpp/MetadataImpl.cpp'
            ],
            'conditions': [
              ['OS=="linux"',
                {
                  'cflags_cc!': [
                    '-fno-rtti'
                  ],
                  'cflags_cc' : [
                    '-Wno-sign-compare',
                    '-Wno-missing-field-initializers',
                    '-Wno-empty-body',
                  ],
                }
              ],
              ['OS=="mac"', {
                'xcode_settings': {
                  'OTHER_CFLAGS': [
                    '-ObjC'
                  ],
                  'MACOSX_DEPLOYMENT_TARGET': '10.7',
                  'GCC_ENABLE_CPP_RTTI': 'YES',
                  'OTHER_CPLUSPLUSFLAGS': [
                    '-std=c++11',
                    '-stdlib=libc++'
                  ],
                  'OTHER_LDFLAGS': [],
                },
                'defines': [
                  'FWD_LINKING_REQ'
                ]
              }]
            ]
          }

        ]
      ]
    },
    {
      "target_name": "librdkafka",
      'conditions': [
        [
          'OS!="win"',
          {
            "type": "static_library",
            "include_dirs": [
              "librdkafka/src",
              '<@(LIBRARY_INCLUDE_PATHS)'
            ],
            'cflags': [
              '-Wunused-function',
              '-Wformat',
              '-Wimplicit-function-declaration',
              '-Wimplicit-fallthrough=0',
              '-Wno-unused-variable',
              '-Wformat-truncation'
            ],
            "conditions": [
              [ '<(ENABLE_SSL)==1',
                {
                  'link_settings': {
                    'libraries' : ['-lssl'],
                  },
                  'xcode_settings': {
                    'libraries' : ['-lssl']
                  }
                }
              ],
              [ '<(WITH_LZ4_EXT)==1',
                {
                  'link_settings': {
                    'libraries' : ['-llz4'],
                  },
                  'xcode_settings': {
                    'libraries' : ['-llz4']
                  },
                  'sources': [
                    'librdkafka/src/lz4.c',
                    'librdkafka/src/lz4frame.c',
                    'librdkafka/src/lz4hc.c'
                  ]
                }
              ],
              [ '<(WITH_SASL_CYRUS)==1',
                {
                  'link_settings': {
                    'libraries' : ['-lsasl2']
                  },
                  'xcode_settings': {
                    'libraries' : ['-lsasl2']
                  },
                  'sources': [
                    'librdkafka/src/rdkafka_sasl_cyrus.c'
                  ]
                }
              ],
              [ '<(WITH_SASL_SCRAM)==1',
                {
                  'sources': [
                    'librdkafka/src/rdkafka_sasl_scram.c'
                  ]
                }
              ],
              [ '<(WITH_SNAPPY)==1',
                {
                  'sources': [
                    'librdkafka/src/snappy.c'
                  ]
                }
              ],
              ['<(WITH_ZLIB)==1',
                {
                  'sources': [
                    'librdkafka/src/rdgz.c'
                  ],
                  'link_settings': {
                    'libraries' : ['-lz']
                  },
                  'xcode_settings': {
                    'libraries' : ['-lz']
                  }
                }
              ],
              ['<(WITH_LIBDL)==1',
                {
                  'sources': [
                    'librdkafka/src/rddl.c'
                  ],
                  'link_settings': {
                    'libraries' : ['-ldl'],
                  },
                  'xcode_settings': {
                    'libraries' : ['-ldl']
                  }
                }
              ],
              ['<(WITH_PLUGINS)==1',
                {
                  'sources': [
                    'librdkafka/src/rdkafka_plugin.c'
                  ]
                }
              ],
            ],
            'cflags!': [
            ],
            'cflags' : [
              '-Wno-type-limits',
              '-Wno-unused-function',
              '-Wno-maybe-uninitialized',
              '-Wno-sign-compare',
              '-Wno-missing-field-initializers',
              '-Wno-empty-body',
              '-Wno-old-style-declaration',
            ],
            'link_settings': {
              # Need to get the library dirs here
              'library_dirs': [
                '<@(LIBRARY_DIRS)'
              ],
              'libraries' : ['-lpthread', '-lcrypto'],
            },
            'xcode_settings': {
              'OTHER_CFLAGS' : [
                '-Wno-sign-compare',
                '-Wno-missing-field-initializers',
                '-ObjC',
                '-Wno-implicit-function-declaration',
                '-Wno-unused-function',
                '-Wno-format'
              ],
              'OTHER_LDFLAGS': [],
              'MACOSX_DEPLOYMENT_TARGET': '10.11',
              'libraries' : ['-lpthread', '-lcrypto']
            },
            'sources': [
              'librdkafka/src/rdkafka.c',
              'librdkafka/src/rdkafka_broker.c',
              'librdkafka/src/rdkafka_msg.c',
              'librdkafka/src/rdkafka_topic.c',
              'librdkafka/src/rdkafka_conf.c',
              'librdkafka/src/rdkafka_timer.c',
              'librdkafka/src/rdkafka_offset.c',
     	        'librdkafka/src/rdkafka_transport.c',
              'librdkafka/src/rdkafka_buf.c',
              'librdkafka/src/rdkafka_queue.c',
              'librdkafka/src/rdkafka_op.c',
              'librdkafka/src/rdkafka_request.c',
              'librdkafka/src/rdkafka_cgrp.c',
              'librdkafka/src/rdkafka_pattern.c',
              'librdkafka/src/rdkafka_partition.c',
              'librdkafka/src/rdkafka_subscription.c',
              'librdkafka/src/rdkafka_assignor.c',
              'librdkafka/src/rdkafka_range_assignor.c',
              'librdkafka/src/rdkafka_roundrobin_assignor.c',
              'librdkafka/src/rdkafka_feature.c',
              'librdkafka/src/rdcrc32.c',
              'librdkafka/src/crc32c.c',
              'librdkafka/src/rdaddr.c',
              'librdkafka/src/rdrand.c',
              'librdkafka/src/rdlist.c',
              'librdkafka/src/tinycthread.c',
              'librdkafka/src/rdlog.c',
              'librdkafka/src/rdstring.c',
              'librdkafka/src/rdkafka_event.c',
              'librdkafka/src/rdkafka_metadata.c',
              'librdkafka/src/rdregex.c',
              'librdkafka/src/rdports.c',
              'librdkafka/src/rdkafka_metadata_cache.c',
              'librdkafka/src/rdavl.c',
              'librdkafka/src/rdkafka_sasl.c',
              'librdkafka/src/rdkafka_sasl_plain.c',
              'librdkafka/src/rdkafka_interceptor.c',
              'librdkafka/src/rdkafka_msgset_writer.c',
              'librdkafka/src/rdkafka_msgset_reader.c',
              'librdkafka/src/rdvarint.c',
              'librdkafka/src/rdbuf.c',
              'librdkafka/src/rdunittest.c',

              # SRC Y
              'librdkafka/src/rdkafka_lz4.c',
              'librdkafka/src/xxhash.c',
            ],
            'cflags!': [ '-fno-rtti' ],
          }
        ]
      ]
    }
  ]
}
