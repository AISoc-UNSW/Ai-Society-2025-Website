TaskBOT 是一款 Discord 机器人，旨在帮助用户通过 Discord 命令管理任务和项目。它通过与目前的website后端 API 交互(目前的地址是localhost:8000，http通信)来存储和检索数据，并利用 `py-cord[voice]` 库实现与 Discord 的集成。

**主要功能包括：** 
- **任务管理**：创建、查看、更新、删除、分配、标记完成任务。 
- **提醒功能**：为任务设置截止日期，并在截止日期前发送提醒。 
- **会议记录**：机器人能够加入语音频道，录音，转录，生成会议记录，并自动创建任务，将其保存到后端。 （speech to text, gen_summary, gen_task的部分我们已经写好可用的函数代码，所以这部分你不必自己实现，到这一步的时候让我提供函数代码给你整合进去即可，加入频道并录音的代码我们也完成了一份初版，可供你参考整合）

**代码结构**：
- `taskbot/bot.py`：主入口，包含 bot 的初始化和事件处理。
- `taskbot/cogs/task_cog.py`：任务管理相关命令。
- `taskbot/cogs/reminder_cog.py`：提醒功能相关命令。
- `taskbot/cogs/meeting_cog.py`：会议记录相关命令。
- `taskbot/utils/`：包含日期校验、语音转录、摘要生成和任务生成等实用函数文件。

**主要依赖库**
-  `py-cord[voice]` : 用于与 Discord API 交互。 
- `PyNaCl`: 需要语音传输功能，是 `py-cord[voice]`。
其他可根据需求安装

**开发计划**：
目前的进度仅仅是划分好了目录结构和一些模板占位代码。
先开发meeting相关功能，测试，然后开发提醒功能，测试，最后开发task相关功能，测试。