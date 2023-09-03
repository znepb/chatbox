package me.znepb.chatbox.commands

import com.mojang.brigadier.context.CommandContext
import com.mojang.brigadier.suggestion.SuggestionProvider
import com.mojang.brigadier.suggestion.Suggestions
import com.mojang.brigadier.suggestion.SuggestionsBuilder
import me.znepb.chatbox.ChatboxPermissions.ALL_CAPABILITIES
import net.minecraft.server.command.ServerCommandSource
import java.util.concurrent.CompletableFuture


class CapabilitySuggestionProvider : SuggestionProvider<ServerCommandSource> {
    override fun getSuggestions(
        context: CommandContext<ServerCommandSource?>,
        builder: SuggestionsBuilder
    ): CompletableFuture<Suggestions?>? {
        for (cap in ALL_CAPABILITIES) {
            builder.suggest(cap)
        }

        return builder.buildFuture()
    }
}